/**
 * Pure helpers for the My Action Plan page (SPEC §3E, §12.4, §12.7).
 * No React, no store — unit-tested in plan-logic.test.ts.
 */
import type {
  ActionCategory,
  ActionItem,
  DocumentInterpretation,
  PatientSessionState,
  Reminder,
  VisitDocument,
} from "@/lib/types";
import { createId } from "@/lib/utils/ids";
import { normalizeWhitespace } from "@/lib/utils/text";

export const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface GroupedActionPlan {
  /** Verified clinician-documented steps (never AI suggestions, never unverified). */
  carePlan: ActionItem[];
  /** Patient-selected goals. */
  wellness: ActionItem[];
  /** Questions for the provider, excluding barrier suggestions and unverified items. */
  questions: ActionItem[];
  /** Items whose source could not be verified — shown under "Needs clarification". */
  needsClarification: ActionItem[];
  /** Barrier-aware administrative suggestions — shown separately from instructions. */
  barrierSuggestions: ActionItem[];
}

/** True for anything that could not be matched to the document text. */
export function isUnverified(a: ActionItem): boolean {
  return a.sourceVerification === "unverified";
}

/** Splits actions into the page's sections with strict origin separation. */
export function groupActionPlan(actions: ActionItem[]): GroupedActionPlan {
  const out: GroupedActionPlan = {
    carePlan: [],
    wellness: [],
    questions: [],
    needsClarification: [],
    barrierSuggestions: [],
  };
  for (const a of actions) {
    if (isUnverified(a)) {
      out.needsClarification.push(a);
      continue;
    }
    if (a.addressesBarrier && a.origin === "ai_suggested") {
      out.barrierSuggestions.push(a);
      continue;
    }
    if (a.category === "care_plan") {
      // Only verified clinician-documented items may live in My Care Plan.
      if (a.origin === "clinician_documented" && a.sourceVerification === "verified") out.carePlan.push(a);
      else out.questions.push(a);
      continue;
    }
    if (a.category === "wellness_goal") out.wellness.push(a);
    else out.questions.push(a);
  }
  return out;
}

/** Section counts; Questions includes items awaiting clarification (SPEC §3E). */
export function sectionCounts(g: GroupedActionPlan): Record<ActionCategory, number> {
  return {
    care_plan: g.carePlan.length,
    wellness_goal: g.wellness.length,
    provider_question: g.questions.length + g.needsClarification.length,
  };
}

/** A goal or question typed by the patient. Always `patient_selected`, no source expected. */
export function createPatientAction(input: {
  patientId: string;
  description: string;
  category: "wellness_goal" | "provider_question";
  rationale: string;
  now?: string;
  id?: string;
}): ActionItem | null {
  const description = normalizeWhitespace(input.description);
  if (!description) return null;
  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id ?? createId("act-own"),
    patientId: input.patientId,
    description,
    type: input.category === "provider_question" ? "question_for_provider" : "other",
    category: input.category,
    origin: "patient_selected",
    sourceVerification: "not_applicable",
    status: "pending",
    rationale: input.rationale,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Active (not dismissed) reminders due within the next `windowMs`, including
 * any already past due, earliest first.
 */
export function dueReminders(
  actions: ActionItem[],
  now: Date = new Date(),
  windowMs: number = REMINDER_WINDOW_MS,
): Array<{ action: ActionItem; reminder: Reminder }> {
  const limit = now.getTime() + windowMs;
  return actions
    .flatMap((action) => {
      const r = action.reminder;
      if (!r || r.dismissed || action.status === "completed") return [];
      const at = new Date(r.at).getTime();
      if (Number.isNaN(at) || at > limit) return [];
      return [{ action, reminder: r }];
    })
    .sort((a, b) => new Date(a.reminder.at).getTime() - new Date(b.reminder.at).getTime());
}

/** Local "YYYY-MM-DDTHH:mm" for <input type="datetime-local">. */
export function toDateTimeLocalValue(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

/** Parses a datetime-local value (local time) to ISO. Returns null when invalid. */
export function dateTimeLocalToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export interface ActionPlanRequestBody {
  patientId: string;
  documentId: string;
  interpretation: Pick<
    DocumentInterpretation,
    "documentId" | "patientId" | "instructions" | "discussWithProvider"
  > | null;
  existing: ActionItem[];
  profile: PatientSessionState["profile"];
  document?: VisitDocument;
}

/**
 * Body for POST /api/action-plan from the active session. Returns null when
 * there is no active document. Pasted/uploaded documents are sent along because
 * the demo has no server-side storage; fixture documents are looked up server-side.
 */
export function buildActionPlanRequest(session: PatientSessionState): ActionPlanRequestBody | null {
  const docId = session.activeDocumentId;
  const document = docId ? session.documents.find((d) => d.id === docId) : undefined;
  if (!document) return null;
  const interp = session.interpretations[document.id];
  return {
    patientId: session.profile.id,
    documentId: document.id,
    interpretation: interp
      ? {
          documentId: interp.documentId,
          patientId: interp.patientId,
          instructions: interp.instructions,
          discussWithProvider: interp.discussWithProvider,
        }
      : null,
    existing: session.actions,
    profile: session.profile,
    ...(document.source === "fixture" ? {} : { document }),
  };
}

/** Validates the route response shape defensively. */
export function parseActionPlanResponse(json: unknown): ActionItem[] {
  if (!json || typeof json !== "object" || !Array.isArray((json as { actions?: unknown }).actions)) {
    throw new Error("Invalid action plan response");
  }
  return (json as { actions: ActionItem[] }).actions;
}
