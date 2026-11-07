/**
 * Ask Kat conversational service (ARCHITECTURE §5, SPEC §12.1–12.3).
 *
 * Pipeline:
 *  1. Deterministic safety rules on the user message (BEFORE any model call).
 *     emergency → concise guidance only, no education, no actions.
 *     concerning → guidance is prepended and the reply continues briefly.
 *  2. Quick prompts → deterministic builders (both modes, no model call).
 *  3. Free text → evidence retrieval (message topics + documented conditions).
 *  4. scripted_demo → scripted lookup (or the honest "unsupported" text);
 *     live_claude → structured Claude call (KatReply schema, effort medium).
 *  5. Post-processing: quotes → verified SourceRefs, referenceIds filtered to
 *     the curated index, contextual actions attached.
 *
 * Logging: none here beyond what the AI client logs (ids/lengths only).
 */
import { generateStructured as defaultGenerateStructured, getAiMode as defaultGetAiMode } from "@/lib/ai/client";
import { AI_ERROR_MESSAGES, type AiResult } from "@/lib/ai/errors";
import { makeMeta } from "@/lib/ai/meta";
import { buildAskKatPrompt } from "@/lib/ai/prompts";
import { KAT_ACTION_KINDS, KatReplySchema, type KatReply } from "@/lib/ai/schemas";
import {
  getScriptedKatReply as defaultGetScriptedKatReply,
  SCRIPTED_UNSUPPORTED,
  type ScriptedKatReply,
} from "@/lib/ai/scripted";
import {
  extractTopics,
  getReference,
  retrieveEvidence as defaultRetrieveEvidence,
  type RetrieveEvidenceInput,
} from "@/lib/evidence";
import { containsFalseReassurance, evaluateSafety } from "@/lib/safety";
import type {
  AiMeta,
  ChatMessage,
  EvidenceMatch,
  KatActionKind,
  KatContextualAction,
  KatRequest,
  KatResponse,
  Language,
  ReferenceId,
  ResponseMode,
  SafetyVerdict,
  SourceRef,
} from "@/lib/types";
import { createId } from "@/lib/utils/ids";
import { isRefVerified, katAction, profileLanguage, scopeKatContext, type KatContext } from "./kat-context";
import { runQuickPrompt, type KatDraft } from "./quick-prompts";
import { locateQuote } from "./source-verification";

export type { KatContext } from "./kat-context";

export const MAX_HISTORY_TURNS = 10;
const EVIDENCE_LIMIT = 5;

export const SCRIPTED_UNSUPPORTED_ES =
  "Esta demostración con respuestas predefinidas no puede responder esa pregunta. Agregue una ANTHROPIC_API_KEY para habilitar respuestas en vivo.";

const STR = {
  en: {
    concerningLead: "I want to make sure you get the right help first.",
    limitations: "What your documents don't say:",
    reassuranceFallback:
      "I can't tell how serious this is, and I don't want to guess. Please check with your care team about this.",
  },
  es: {
    concerningLead: "Primero quiero asegurarme de que reciba la ayuda adecuada.",
    limitations: "Lo que sus documentos no dicen:",
    reassuranceFallback:
      "No puedo saber qué tan grave es esto y no quiero adivinar. Por favor, consulte esto con su equipo de atención.",
  },
} as const;

// ---------------------------------------------------------------------------
// Dependencies (injectable for tests)
// ---------------------------------------------------------------------------

export interface AskKatDeps {
  getAiMode: () => ResponseMode;
  generateStructured: (req: Parameters<typeof defaultGenerateStructured<KatReply>>[0]) => Promise<AiResult<KatReply>>;
  getScriptedKatReply: (
    patientId: string,
    message: string,
    quickPrompt?: KatRequest["quickPrompt"],
  ) => ScriptedKatReply | null;
  retrieveEvidence: (input: RetrieveEvidenceInput) => EvidenceMatch[];
  /** Reference index lookup used to filter referenceIds. */
  referenceExists: (id: ReferenceId) => boolean;
}

const defaultDeps: AskKatDeps = {
  getAiMode: defaultGetAiMode,
  generateStructured: (req) => defaultGenerateStructured(req),
  getScriptedKatReply: defaultGetScriptedKatReply,
  retrieveEvidence: (input) => defaultRetrieveEvidence(input),
  referenceExists: (id) => getReference(id) !== undefined,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Postpartum context for the safety rules, from the documented profile field only. */
function hasPostpartumContext(text: string | undefined): boolean {
  if (!text) return false;
  return /\b(postpartum|post-partum|delivery|gave birth|given birth|breastfeed\w*|posparto|parto|lactancia|amamant\w*)\b/i.test(
    text,
  );
}

export function trimHistory<T extends { role: string; content: string }>(history: readonly T[] | undefined): T[] {
  return (history ?? []).filter((m) => m.content.trim().length > 0).slice(-MAX_HISTORY_TURNS);
}

function meta(mode: ResponseMode, language: Language, model?: string, deterministic = false): AiMeta {
  const m = makeMeta(mode, model, language);
  return deterministic ? { ...m, generatedBy: "deterministic" } : { ...m, generatedBy: mode === "live_claude" ? "model" : "scripted" };
}

function unique<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = key(i);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function refKey(ref: SourceRef): string {
  return `${ref.documentId}:${ref.start}:${ref.end}`;
}

function actionKey(a: KatContextualAction): string {
  const p = a.payload ?? {};
  if (a.kind === "view_source") {
    const ref = p.sourceRef as SourceRef | undefined;
    return `view_source:${ref ? refKey(ref) : ""}`;
  }
  if (a.kind === "add_question") return `add_question:${String(p.question ?? "").toLowerCase().trim()}`;
  return a.kind;
}

function locate(ctx: KatContext, quote: string | null | undefined): SourceRef | null {
  if (!ctx.document || !quote?.trim()) return null;
  const ref = locateQuote(ctx.document, quote, { onAmbiguous: "first" });
  return ref && isRefVerified(ctx.document, ref) ? ref : null;
}

/** Keep only ids that exist in the curated index (and, when given, in the allowed set). */
export function filterReferenceIds(
  ids: readonly string[],
  referenceExists: (id: ReferenceId) => boolean,
  allowed?: ReadonlySet<string>,
): ReferenceId[] {
  return [...new Set(ids)].filter((id) => referenceExists(id) && (!allowed || allowed.has(id)));
}

function isKatActionKind(kind: string): kind is KatActionKind {
  return (KAT_ACTION_KINDS as readonly string[]).includes(kind);
}

function hasUnresolvedItems(ctx: KatContext): boolean {
  const interp = ctx.interpretation;
  if (interp) {
    if (interp.unansweredQuestions.length > 0) return true;
    if (interp.instructions.some((i) => i.sourceVerification !== "verified" || !isRefVerified(ctx.document, i.sourceRef))) {
      return true;
    }
  }
  if (ctx.actions.some((a) => a.status === "needs_clarification")) return true;
  return ctx.savedQuestions.length > 0;
}

/** Attach contextual actions (SPEC §12.3) and normalize/dedupe/cap. */
function withContextualActions(
  draft: KatDraft,
  ctx: KatContext,
  language: Language,
): KatContextualAction[] {
  const actions = [...draft.actions];
  const has = (kind: KatActionKind) => actions.some((a) => a.kind === kind);

  if (draft.sourceRefs.length > 0 && !has("view_source")) {
    actions.push(katAction(language, "view_source", { sourceRef: draft.sourceRefs[0] }));
  }
  for (const q of draft.suggestedQuestions) {
    if (!actions.some((a) => a.kind === "add_question" && a.payload?.question === q)) {
      actions.push(katAction(language, "add_question", { question: q }));
    }
  }
  const questionIds = (ctx.teachBackQuestions ?? []).map((q) => q.id);
  if (questionIds.length > 0 && !has("check_understanding")) {
    actions.push(katAction(language, "check_understanding", { questionIds, href: "/check" }));
  }
  if (hasUnresolvedItems(ctx) && !has("prepare_appointment")) {
    actions.push(katAction(language, "prepare_appointment", { href: "/follow-up" }));
  }
  // Builders already cap list sizes; every suggested question keeps its add_question action.
  return unique(actions, actionKey);
}

function prependGuidance(content: string, safety: SafetyVerdict, language: Language): string {
  if (safety.level !== "concerning" || !safety.guidance) return content;
  return `${safety.guidance}\n\n${STR[language].concerningLead}\n\n${content}`.trim();
}

function buildMessage(
  draft: KatDraft,
  ctx: KatContext,
  req: KatRequest,
  safety: SafetyVerdict,
  aiMeta: AiMeta,
  deps: AskKatDeps,
  opts: { allowedReferenceIds?: ReadonlySet<string>; error?: string } = {},
): ChatMessage {
  const language = profileLanguage(ctx.profile);
  const sourceRefs = unique(
    draft.sourceRefs.filter((r) => isRefVerified(ctx.document, r)),
    refKey,
  );
  const referenceIds = filterReferenceIds(draft.referenceIds, deps.referenceExists, opts.allowedReferenceIds);
  const actions = withContextualActions({ ...draft, sourceRefs }, ctx, language);
  const message: ChatMessage = {
    id: createId("msg"),
    role: "assistant",
    content: prependGuidance(draft.content, safety, language),
    createdAt: new Date().toISOString(),
    referenceIds,
    sourceRefs,
    actions,
    safety,
    meta: aiMeta,
  };
  if (req.quickPrompt) message.quickPrompt = req.quickPrompt;
  if (opts.error) message.error = opts.error;
  return message;
}

/** Convert a scripted reply or model reply into a draft (quotes → verified refs). */
function draftFromReply(
  reply: {
    content: string;
    referenceIds?: string[];
    sourceQuotes?: string[];
    actions: { kind: string; label?: string; question?: string | null; quote?: string | null; payload?: Record<string, unknown> }[];
    limitations?: string[];
  },
  ctx: KatContext,
  language: Language,
): KatDraft {
  const sourceRefs: SourceRef[] = [];
  for (const q of reply.sourceQuotes ?? []) {
    const ref = locate(ctx, q);
    if (ref) sourceRefs.push(ref);
  }
  const actions: KatContextualAction[] = [];
  const suggestedQuestions: string[] = [];
  for (const a of reply.actions) {
    if (!isKatActionKind(a.kind)) continue;
    const label = a.label?.trim() || undefined;
    if (a.kind === "view_source") {
      const fromPayload = a.payload?.sourceRef as SourceRef | undefined;
      const ref = isRefVerified(ctx.document, fromPayload)
        ? fromPayload
        : locate(ctx, a.quote ?? (typeof a.payload?.quote === "string" ? a.payload.quote : undefined));
      if (!ref) continue; // never point at a passage that isn't in the document
      sourceRefs.push(ref);
      actions.push(katAction(language, "view_source", { sourceRef: ref }, label));
    } else if (a.kind === "add_question") {
      const q = (a.question ?? (typeof a.payload?.question === "string" ? a.payload.question : ""))?.trim();
      if (!q) continue;
      suggestedQuestions.push(q);
      actions.push(katAction(language, "add_question", { question: q }, label));
    } else if (a.kind === "check_understanding") {
      const questionIds = (ctx.teachBackQuestions ?? []).map((t) => t.id);
      if (questionIds.length === 0) continue;
      actions.push(katAction(language, "check_understanding", { questionIds, href: "/check" }, label));
    } else if (a.kind === "view_action_plan") {
      actions.push(katAction(language, "view_action_plan", { href: "/action-plan" }, label));
    } else {
      actions.push(katAction(language, "prepare_appointment", { href: "/follow-up" }, label));
    }
  }
  let content = reply.content.trim();
  const limitations = (reply.limitations ?? []).map((l) => l.trim()).filter(Boolean).slice(0, 3);
  if (limitations.length > 0) {
    content = `${content}\n\n${STR[language].limitations}\n${limitations.map((l) => `• ${l}`).join("\n")}`;
  }
  return {
    content,
    sourceRefs,
    referenceIds: reply.referenceIds ?? [],
    actions,
    suggestedQuestions,
  };
}

function evidenceFor(req: KatRequest, ctx: KatContext, deps: AskKatDeps): EvidenceMatch[] {
  if (ctx.evidence) return ctx.evidence;
  const language = profileLanguage(ctx.profile);
  const topics = [...extractTopics(req.message), ...ctx.profile.conditions];
  return deps.retrieveEvidence({ query: req.message, topics, language, limit: EVIDENCE_LIMIT });
}

// ---------------------------------------------------------------------------
// askKat
// ---------------------------------------------------------------------------

export async function askKat(
  req: KatRequest,
  rawCtx: KatContext,
  depsOverride: Partial<AskKatDeps> = {},
): Promise<KatResponse> {
  const deps: AskKatDeps = { ...defaultDeps, ...depsOverride };
  const ctx = scopeKatContext(req.patientId, rawCtx);
  const language = profileLanguage(ctx.profile);
  const mode = deps.getAiMode();

  // (1) Safety first — deterministic, before any lookup or model call.
  const safety = evaluateSafety(req.message, {
    language,
    postpartumContext: hasPostpartumContext(ctx.profile.pregnancyOrPostpartumContext),
    source: "message",
  });

  if (safety.level === "emergency") {
    const message: ChatMessage = {
      id: createId("msg"),
      role: "assistant",
      content: safety.guidance ?? "",
      createdAt: new Date().toISOString(),
      referenceIds: [],
      sourceRefs: [],
      actions: [],
      safety,
      meta: meta("scripted_demo", language, undefined, true),
    };
    if (req.quickPrompt) message.quickPrompt = req.quickPrompt;
    return { message, safety };
  }

  // (2) Deterministic quick prompts (never call a model).
  const quick = runQuickPrompt(req.quickPrompt, ctx);
  if (quick) {
    const message = buildMessage(quick, ctx, req, safety, meta("scripted_demo", language, undefined, true), deps);
    return { message, safety };
  }

  // (3) Evidence for free text.
  const evidence = evidenceFor(req, ctx, deps);

  // (4a) Scripted Demo Mode.
  if (mode === "scripted_demo") {
    const scripted = deps.getScriptedKatReply(req.patientId, req.message, req.quickPrompt);
    if (!scripted) {
      const draft: KatDraft = {
        content: language === "es" ? SCRIPTED_UNSUPPORTED_ES : SCRIPTED_UNSUPPORTED,
        sourceRefs: [],
        referenceIds: [],
        actions: [],
        suggestedQuestions: [],
      };
      const message = buildMessage(draft, ctx, req, safety, meta("scripted_demo", language), deps);
      return { message, safety };
    }
    const draft = draftFromReply(
      {
        content: scripted.content,
        referenceIds: scripted.referenceIds,
        sourceQuotes: scripted.sourceQuotes,
        actions: (scripted.actions ?? []).map((a) => ({ kind: a.kind, label: a.label, payload: a.payload })),
      },
      ctx,
      language,
    );
    const message = buildMessage(draft, ctx, req, safety, meta("scripted_demo", language), deps);
    return { message, safety };
  }

  // (4b) Live Claude.
  const prompt = buildAskKatPrompt({
    profile: ctx.profile,
    document: ctx.document,
    interpretation: ctx.interpretation,
    actions: ctx.actions,
    savedQuestions: ctx.savedQuestions,
    evidence,
    history: trimHistory(req.history),
    question: req.message,
    quickPrompt: req.quickPrompt,
  });
  const result = await deps.generateStructured({
    schema: KatReplySchema,
    system: prompt.system,
    user: prompt.user,
    effort: "medium",
    label: "ask-kat",
  });

  if (!result.ok) {
    const draft: KatDraft = {
      content: result.error || AI_ERROR_MESSAGES.api,
      sourceRefs: [],
      referenceIds: [],
      actions: [],
      suggestedQuestions: [],
    };
    const message = buildMessage(draft, ctx, req, safety, meta("live_claude", language), deps, {
      error: result.error || AI_ERROR_MESSAGES.api,
    });
    message.actions = [];
    return { message, safety };
  }

  const reply = result.data;
  let content = reply.content;
  // Supplementary output check: never false-reassure a concerning message.
  if (safety.level === "concerning" && containsFalseReassurance(content)) {
    content = STR[language].reassuranceFallback;
  }
  const draft = draftFromReply(
    {
      content,
      referenceIds: reply.referenceIds,
      sourceQuotes: reply.sourceQuotes,
      actions: reply.suggestedActions.map((a) => ({
        kind: a.kind,
        label: a.label,
        question: a.questionText,
        quote: a.sourceQuote,
      })),
      limitations: reply.limitations,
    },
    ctx,
    language,
  );
  const allowed = new Set(evidence.map((e) => e.reference.id));
  const message = buildMessage(draft, ctx, req, safety, meta("live_claude", language, result.model), deps, {
    allowedReferenceIds: allowed,
  });
  return { message, safety };
}
