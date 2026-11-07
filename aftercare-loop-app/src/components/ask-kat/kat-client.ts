/**
 * Pure helpers for the Ask Kat UI: request-body assembly, history trimming,
 * the first-open welcome message, route visibility and contextual-action
 * routing. No React, no store access — everything here is unit-tested.
 */
import type {
  ActionItem,
  ChatMessage,
  KatContextualAction,
  PatientId,
  PatientSessionState,
  QuickPromptId,
  ResponseMode,
  SourceRef,
  VisitDocument,
} from "@/lib/types";
import { isNavActive } from "@/components/layout/nav-config";

/** Max prior turns sent to /api/ask-kat (mirrors MAX_HISTORY_TURNS on the server). */
export const KAT_HISTORY_TURNS = 10;

/** Routes where the Ask Kat FAB/panel is not shown (clinician view, evaluation). */
export const KAT_HIDDEN_ROUTES = ["/care-team", "/evaluation"] as const;

export function isKatHiddenOn(pathname: string | null | undefined): boolean {
  return KAT_HIDDEN_ROUTES.some((href) => isNavActive(pathname, href));
}

const WELCOME_PREFIX = "kat-welcome";

export function welcomeMessageId(patientId: PatientId): string {
  return `${WELCOME_PREFIX}-${patientId}`;
}

export function isWelcomeMessage(msg: Pick<ChatMessage, "id">): boolean {
  return msg.id.startsWith(`${WELCOME_PREFIX}-`);
}

/**
 * The SPEC §12.1 welcome (exact text comes from the i18n dictionary). It is a
 * fixed UI greeting, not AI output, so it carries no AiMeta.
 */
export function buildWelcomeMessage(patientId: PatientId, text: string, now = new Date()): ChatMessage {
  return {
    id: welcomeMessageId(patientId),
    role: "assistant",
    content: text,
    createdAt: now.toISOString(),
  };
}

/** True when the patient has sent at least one message. */
export function hasUserMessages(chat: readonly ChatMessage[]): boolean {
  return chat.some((m) => m.role === "user");
}

/**
 * Prior turns for the API: no welcome, no error bubbles, no empty content; the
 * trailing user message (the one being sent) is excluded; last N turns only.
 */
export function buildHistory(
  chat: readonly ChatMessage[],
  limit = KAT_HISTORY_TURNS,
): Pick<ChatMessage, "role" | "content">[] {
  const turns = chat.filter((m) => !isWelcomeMessage(m) && !m.error && m.content.trim().length > 0);
  if (turns.length > 0 && turns[turns.length - 1]!.role === "user") turns.pop();
  return turns.slice(-limit).map((m) => ({ role: m.role, content: m.content }));
}

export function activeDocumentOf(session: PatientSessionState): VisitDocument | undefined {
  if (!session.activeDocumentId) return undefined;
  return session.documents.find((d) => d.id === session.activeDocumentId);
}

export interface AskKatBody {
  patientId: PatientId;
  message: string;
  quickPrompt?: QuickPromptId;
  history: Pick<ChatMessage, "role" | "content">[];
  profile: PatientSessionState["profile"];
  context: {
    documentId?: string;
    document?: VisitDocument;
    interpretation?: PatientSessionState["interpretations"][string];
    actions: ActionItem[];
    savedQuestions: string[];
  };
}

/**
 * Request body for POST /api/ask-kat. Context = active document id (plus the
 * full text only for pasted/uploaded documents, which the server can't
 * re-load), its interpretation, actions, saved questions and the last 10 turns.
 * Everything is taken from ONE patient's session — never mixed.
 */
export function buildAskKatBody(
  session: PatientSessionState,
  message: string,
  quickPrompt?: QuickPromptId,
): AskKatBody {
  const doc = activeDocumentOf(session);
  const interpretation = doc ? session.interpretations[doc.id] : undefined;
  const patientId = session.profile.id;
  return {
    patientId,
    message,
    ...(quickPrompt ? { quickPrompt } : {}),
    history: buildHistory(session.chat),
    profile: session.profile,
    context: {
      ...(doc ? { documentId: doc.id } : {}),
      ...(doc && doc.source !== "fixture" ? { document: doc } : {}),
      ...(interpretation ? { interpretation } : {}),
      actions: session.actions.filter((a) => a.patientId === patientId),
      savedQuestions: [...session.savedQuestions],
    },
  };
}

/** Body for POST /api/action-plan (used by the "plan my next steps" chip). */
export function buildActionPlanBody(session: PatientSessionState) {
  const doc = activeDocumentOf(session);
  if (!doc) return null;
  const interpretation = session.interpretations[doc.id] ?? null;
  return {
    patientId: session.profile.id,
    documentId: doc.id,
    interpretation,
    existing: session.actions,
    profile: session.profile,
    ...(doc.source !== "fixture" ? { document: doc } : {}),
  };
}

/**
 * Mode shown in the panel header/banner. Prefers the latest reply whose mode
 * reflects the server's real configuration (not a deterministic quick-prompt
 * reply), then any reply with meta, then the active interpretation. Undefined
 * when nothing AI-shaped has been produced yet (we never guess).
 */
export function panelModeOf(
  chat: readonly ChatMessage[],
  fallback?: ResponseMode,
): ResponseMode | undefined {
  const withMeta = chat.filter((m) => m.role === "assistant" && m.meta);
  const real = [...withMeta].reverse().find((m) => m.meta?.generatedBy !== "deterministic");
  return real?.meta?.mode ?? withMeta[withMeta.length - 1]?.meta?.mode ?? fallback;
}

export function isSourceRef(value: unknown): value is SourceRef {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.documentId === "string" &&
    typeof r.start === "number" &&
    typeof r.end === "number" &&
    typeof r.quote === "string"
  );
}

export function sameRef(a: SourceRef, b: SourceRef): boolean {
  return a.documentId === b.documentId && a.start === b.start && a.end === b.end;
}

export const KAT_ROUTES = {
  check_understanding: "/check",
  view_action_plan: "/action-plan",
  prepare_appointment: "/follow-up",
} as const;

/** Navigation target for a contextual action (null for in-panel actions). */
export function hrefForAction(action: KatContextualAction): string | null {
  switch (action.kind) {
    case "check_understanding": {
      const p = action.payload ?? {};
      const ids = Array.isArray(p.questionIds) ? p.questionIds.filter((x): x is string => typeof x === "string") : [];
      const single = typeof p.questionId === "string" ? p.questionId : ids[0];
      return single
        ? `${KAT_ROUTES.check_understanding}?questionId=${encodeURIComponent(single)}`
        : KAT_ROUTES.check_understanding;
    }
    case "view_action_plan":
      return KAT_ROUTES.view_action_plan;
    case "prepare_appointment":
      return KAT_ROUTES.prepare_appointment;
    default:
      return null;
  }
}

export function questionOf(action: KatContextualAction): string | null {
  const q = action.payload?.question;
  return typeof q === "string" && q.trim() ? q.trim() : null;
}

/** Ensures a "View my action plan" action is offered (after plan_next_steps). */
export function withViewActionPlan(message: ChatMessage, label: string): ChatMessage {
  const actions = message.actions ?? [];
  if (actions.some((a) => a.kind === "view_action_plan")) return message;
  return {
    ...message,
    actions: [...actions, { kind: "view_action_plan", label, payload: { href: KAT_ROUTES.view_action_plan } }],
  };
}

/** Extracts a safe error string from a failed API JSON body. */
export function errorFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && typeof (body as { error?: unknown }).error === "string") {
    const e = (body as { error: string }).error.trim();
    if (e) return e;
  }
  return fallback;
}
