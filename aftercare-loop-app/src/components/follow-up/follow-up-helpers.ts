/**
 * Pure helpers for the Follow Up page (no React, no store).
 * Map summary strings back to their origin so every item can carry an
 * OriginBadge, and build simulated care-team requests.
 */
import type {
  ActionItem,
  ActionOrigin,
  CareTeamRequest,
  CareTeamRequestType,
  CommunicationSummary,
  PatientId,
} from "@/lib/types";
import { createCareTeamRequest } from "@/lib/services/care-team";
import { normalizeWhitespace } from "@/lib/utils/text";

/** Request types a patient can pick in the Follow Up form (SPEC §12.10). */
export const PATIENT_REQUEST_TYPES: readonly CareTeamRequestType[] = [
  "clarification",
  "refill_request",
  "side_effect_question",
  "reported_barrier",
];

const norm = (s: string) => normalizeWhitespace(s).toLowerCase();

/**
 * Finds the action a summary line was built from. Unresolved lines are
 * "<description> (notes)", so we match the longest description that is the
 * whole line or a prefix followed by " (".
 */
export function findActionForLine(line: string, actions: ActionItem[]): ActionItem | undefined {
  const l = norm(line);
  let best: ActionItem | undefined;
  let bestLen = -1;
  for (const a of actions) {
    const d = norm(a.description);
    if (!d) continue;
    if ((l === d || l.startsWith(`${d} (`)) && d.length > bestLen) {
      best = a;
      bestLen = d.length;
    }
  }
  return best;
}

/** Saved questions were saved by the patient; others come from action items. */
export function questionOrigin(
  question: string,
  savedQuestions: string[],
  actions: ActionItem[],
): ActionOrigin {
  const q = norm(question);
  if (savedQuestions.some((s) => norm(s) === q)) return "patient_selected";
  const action = actions.find((a) => a.category === "provider_question" && norm(a.description) === q);
  return action?.origin ?? "patient_selected";
}

/** True when the summary has nothing in any section. */
export function isSummaryEmpty(summary: CommunicationSummary): boolean {
  return (
    summary.questions.length === 0 &&
    summary.barriers.length === 0 &&
    summary.unresolvedItems.length === 0 &&
    summary.documentedInstructions.length === 0
  );
}

/**
 * Simulated "send to my care team": a clarification request carrying the
 * (possibly edited) summary text. Returns null for empty text. Nothing is
 * transmitted — the request only lives in local demo state.
 */
export function buildSummaryRequest(input: {
  patientId: PatientId;
  text: string;
  summaryLine: string;
  now?: string;
}): CareTeamRequest | null {
  const details = input.text.trim();
  if (!details) return null;
  return createCareTeamRequest({
    patientId: input.patientId,
    type: "clarification",
    summary: input.summaryLine,
    details,
    now: input.now,
  });
}

/** Form request; null when the summary is blank. */
export function buildFormRequest(input: {
  patientId: PatientId;
  type: CareTeamRequestType;
  summary: string;
  relatedActionId?: string;
  now?: string;
}): CareTeamRequest | null {
  if (!normalizeWhitespace(input.summary)) return null;
  return createCareTeamRequest({
    patientId: input.patientId,
    type: input.type,
    summary: input.summary,
    relatedActionId: input.relatedActionId || undefined,
    now: input.now,
  });
}
