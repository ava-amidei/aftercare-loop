/**
 * Ask Kat context: the per-patient bundle Kat is allowed to see, plus the
 * request-body schema for POST /api/ask-kat and the server-side assembly that
 * re-loads fixture data by patientId (never trusting the client for identity).
 *
 * Patient isolation (SPEC §12.2): every item in a KatContext must belong to the
 * requesting patient. `scopeKatContext` enforces that defensively, so context
 * from patient A can never leak into a reply for patient B.
 */
import { z } from "zod/v4";
import { DocumentInterpretationSchema, ACTION_TYPES, ACCESS_BARRIERS, SourceRefSchema } from "@/lib/ai/schemas";
import { sanitizeDocumentText } from "@/lib/safety";
import { getDocument, getDocuments, getPatient } from "@/data/patients";
import { getGroundTruth } from "@/data/ground-truth";
import { t } from "@/lib/i18n/core";
import type {
  ActionItem,
  DocumentInterpretation,
  EvidenceMatch,
  KatActionKind,
  KatContextualAction,
  KatRequest,
  Language,
  PatientId,
  PatientProfile,
  SourceRef,
  TeachBackQuestion,
  VisitDocument,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// KatContext
// ---------------------------------------------------------------------------

export interface KatContext {
  profile: PatientProfile;
  /** Active visit document (fixture or pasted). */
  document?: VisitDocument;
  interpretation?: DocumentInterpretation;
  actions: ActionItem[];
  savedQuestions: string[];
  /** Teach-back questions available for the active document (enables check_understanding). */
  teachBackQuestions?: TeachBackQuestion[];
  /** Optional pre-retrieved evidence; when absent askKat retrieves it itself. */
  evidence?: EvidenceMatch[];
}

/**
 * Payload shapes for KatContextualAction (consumed by the Ask Kat panel):
 *  - view_source:         { sourceRef: SourceRef }
 *  - add_question:        { question: string, barrier?: AccessBarrier }
 *  - check_understanding: { questionIds: string[], href: "/check" }
 *  - view_action_plan:    { href: "/action-plan" }
 *  - prepare_appointment: { href: "/follow-up" }
 */
export const KAT_ACTION_HREFS = {
  check_understanding: "/check",
  view_action_plan: "/action-plan",
  prepare_appointment: "/follow-up",
} as const;

export class KatContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KatContextError";
  }
}

export function profileLanguage(profile: Pick<PatientProfile, "language">): Language {
  return profile.language === "es" ? "es" : "en";
}

export function actionLabel(language: Language, kind: KatActionKind): string {
  return t(language, `askKat.action.${kind}`);
}

/** True when `ref` points at exactly `ref.quote` inside `doc` (ARCHITECTURE §2.5). */
export function isRefVerified(doc: VisitDocument | undefined, ref: SourceRef | undefined): ref is SourceRef {
  if (!doc || !ref) return false;
  if (ref.documentId !== doc.id) return false;
  if (!Number.isInteger(ref.start) || !Number.isInteger(ref.end) || ref.start < 0 || ref.end <= ref.start) {
    return false;
  }
  return doc.text.slice(ref.start, ref.end) === ref.quote;
}

/**
 * Drop everything in `ctx` that does not belong to `patientId`.
 * Throws when the profile itself belongs to someone else (a programming error).
 */
export function scopeKatContext(patientId: PatientId, ctx: KatContext): KatContext {
  if (!ctx.profile || ctx.profile.id !== patientId) {
    throw new KatContextError("Kat context does not belong to the requesting patient.");
  }
  const document = ctx.document && ctx.document.patientId === patientId ? ctx.document : undefined;
  const interpretation =
    ctx.interpretation &&
    ctx.interpretation.patientId === patientId &&
    (!document || ctx.interpretation.documentId === document.id)
      ? ctx.interpretation
      : undefined;
  const actions = (ctx.actions ?? []).filter((a) => a.patientId === patientId);
  const teachBackQuestions = (ctx.teachBackQuestions ?? []).filter(
    (q) => q.patientId === patientId && (!document || q.documentId === document.id),
  );
  return {
    profile: ctx.profile,
    document,
    interpretation,
    actions,
    savedQuestions: [...(ctx.savedQuestions ?? [])],
    teachBackQuestions,
    evidence: ctx.evidence,
  };
}

// ---------------------------------------------------------------------------
// Request body schema (zod v4 so the interpretation mirror can be reused)
// ---------------------------------------------------------------------------

const MAX_ID = 128;
const MAX_TEXT = 20_000;

const ProfileInputSchema = z.object({
  id: z.string().min(1).max(MAX_ID),
  displayName: z.string().max(200).optional(),
  ageRange: z.string().max(50).optional(),
  language: z.enum(["en", "es"]).optional(),
  explanationLevel: z.enum(["simple", "standard", "detailed"]).optional(),
  accessibility: z
    .array(z.enum(["larger_text", "high_contrast", "reduced_motion", "screen_reader"]))
    .max(10)
    .optional(),
  conditions: z.array(z.string().max(200)).max(30).optional(),
  medications: z
    .array(
      z.object({
        name: z.string().max(200),
        dose: z.string().max(200).optional(),
        frequency: z.string().max(200).optional(),
        documentedPurpose: z.string().max(500).optional(),
      }),
    )
    .max(30)
    .optional(),
  careInstructions: z.array(z.string().max(1000)).max(50).optional(),
  healthGoals: z.array(z.string().max(500)).max(30).optional(),
  barriers: z.array(z.enum(ACCESS_BARRIERS)).max(10).optional(),
  pregnancyOrPostpartumContext: z.string().max(500).optional(),
  scenarioSummary: z.string().max(500).optional(),
});

const DocumentInputSchema = z.object({
  id: z.string().min(1).max(MAX_ID),
  patientId: z.string().min(1).max(MAX_ID),
  title: z.string().max(300),
  text: z.string().max(MAX_TEXT),
  sections: z
    .array(
      z.object({
        id: z.string().max(MAX_ID),
        heading: z.string().max(300),
        start: z.number().int().nonnegative(),
        end: z.number().int().nonnegative(),
      }),
    )
    .max(100)
    .optional(),
  createdAt: z.string().max(64),
  source: z.enum(["fixture", "pasted", "uploaded_txt"]),
});

const AiMetaInputSchema = z.object({
  mode: z.enum(["live_claude", "live_gemini", "scripted_demo"]),
  model: z.string().max(200).optional(),
  generatedAt: z.string().max(64),
  disclaimer: z.string().max(2000),
});

const InterpretationInputSchema = DocumentInterpretationSchema.extend({
  meta: AiMetaInputSchema.optional(),
});

const ActionItemInputSchema = z.object({
  id: z.string().min(1).max(MAX_ID),
  patientId: z.string().min(1).max(MAX_ID),
  documentId: z.string().max(MAX_ID).optional(),
  description: z.string().max(2000),
  type: z.enum(ACTION_TYPES),
  category: z.enum(["care_plan", "wellness_goal", "provider_question"]),
  origin: z.enum(["clinician_documented", "patient_selected", "ai_suggested"]),
  sourceRef: SourceRefSchema.optional(),
  sourceVerification: z.enum(["verified", "unverified", "not_applicable"]),
  dueDate: z.string().max(64).optional(),
  reminder: z.object({ at: z.string().max(64), label: z.string().max(300), dismissed: z.boolean() }).optional(),
  status: z.enum(["pending", "completed", "needs_clarification"]),
  rationale: z.string().max(2000),
  addressesBarrier: z.enum(ACCESS_BARRIERS).optional(),
  createdAt: z.string().max(64),
  updatedAt: z.string().max(64),
});

export const QUICK_PROMPT_IDS = [
  "what_should_i_ask",
  "explain_my_diagnosis",
  "understand_my_results",
  "plan_next_steps",
  "free_text",
] as const;

export const AskKatBodySchema = z.object({
  patientId: z.string().min(1).max(MAX_ID),
  message: z.string().trim().min(1).max(4000),
  quickPrompt: z.enum(QUICK_PROMPT_IDS).optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) }))
    .max(200)
    .default([]),
  /** Optional client-edited profile (same patient only). */
  profile: ProfileInputSchema.optional(),
  context: z
    .object({
      documentId: z.string().max(MAX_ID).optional(),
      /** Pasted/uploaded document not present in the fixtures. */
      document: DocumentInputSchema.optional(),
      profile: ProfileInputSchema.optional(),
      interpretation: InterpretationInputSchema.optional(),
      actions: z.array(ActionItemInputSchema).max(300).default([]),
      savedQuestions: z.array(z.string().max(1000)).max(200).default([]),
    })
    .default({ actions: [], savedQuestions: [] }),
});

export type AskKatBody = z.infer<typeof AskKatBodySchema>;

// ---------------------------------------------------------------------------
// Server-side assembly
// ---------------------------------------------------------------------------

export class UnknownPatientError extends KatContextError {
  constructor() {
    super("Unknown patient.");
    this.name = "UnknownPatientError";
  }
}

export class PatientMismatchError extends KatContextError {
  constructor() {
    super("Request context does not belong to this patient.");
    this.name = "PatientMismatchError";
  }
}

function mergeProfile(base: PatientProfile, patch: AskKatBody["profile"]): PatientProfile {
  if (!patch) return base;
  if (patch.id !== base.id) throw new PatientMismatchError();
  const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
  return { ...base, ...defined, id: base.id } as PatientProfile;
}

function resolveDocument(patientId: PatientId, body: AskKatBody): VisitDocument | undefined {
  const ctx = body.context;
  if (ctx.document) {
    if (ctx.document.patientId !== patientId) throw new PatientMismatchError();
    const fixture = getDocument(ctx.document.id);
    if (fixture) {
      if (fixture.patientId !== patientId) throw new PatientMismatchError();
      return fixture; // prefer the server copy of a fixture document
    }
    const text = sanitizeDocumentText(ctx.document.text);
    // Section offsets from the client are dropped if they no longer fit the sanitized text.
    const sections = ctx.document.sections?.filter((s) => s.end <= text.length && s.start < s.end);
    return { ...ctx.document, text, sections };
  }
  const wantedId = ctx.documentId ?? ctx.interpretation?.documentId;
  if (wantedId) {
    const doc = getDocument(wantedId);
    if (doc) {
      if (doc.patientId !== patientId) throw new PatientMismatchError();
      return doc;
    }
    return undefined;
  }
  return getDocuments(patientId)[0];
}

/**
 * Build a KatContext from a validated request body. The profile is re-loaded
 * from fixtures by patientId; client data for another patient is rejected.
 */
export function buildKatContextFromBody(body: AskKatBody): { request: KatRequest; context: KatContext } {
  const patientId = body.patientId;
  const fixture = getPatient(patientId);
  if (!fixture) throw new UnknownPatientError();
  const profile = mergeProfile(mergeProfile(fixture, body.profile), body.context.profile);

  const document = resolveDocument(patientId, body);

  const rawInterp = body.context.interpretation;
  if (rawInterp && rawInterp.patientId !== patientId) throw new PatientMismatchError();
  const interpretation: DocumentInterpretation | undefined =
    rawInterp && document && rawInterp.documentId === document.id
      ? ({
          ...rawInterp,
          meta: rawInterp.meta ?? {
            mode: "scripted_demo",
            generatedAt: new Date(0).toISOString(),
            disclaimer: "",
          },
        } as DocumentInterpretation)
      : undefined;

  if (body.context.actions.some((a) => a.patientId !== patientId)) throw new PatientMismatchError();
  const actions = body.context.actions as ActionItem[];

  const teachBackQuestions = document
    ? (getGroundTruth(patientId)?.teachBackQuestions ?? []).filter((q) => q.documentId === document.id)
    : [];

  const context = scopeKatContext(patientId, {
    profile,
    document,
    interpretation,
    actions,
    savedQuestions: body.context.savedQuestions,
    teachBackQuestions,
  });

  const request: KatRequest = {
    patientId,
    message: body.message,
    quickPrompt: body.quickPrompt,
    history: body.history,
  };
  return { request, context };
}

/** Convenience for building a labeled action. */
export function katAction(
  language: Language,
  kind: KatActionKind,
  payload?: Record<string, unknown>,
  label?: string,
): KatContextualAction {
  return { kind, label: label ?? actionLabel(language, kind), ...(payload ? { payload } : {}) };
}
