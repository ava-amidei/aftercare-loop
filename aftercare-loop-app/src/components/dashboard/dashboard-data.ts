/**
 * Pure, condition-agnostic view-model helpers for the dashboard (SPEC §3A).
 * No React, no store — everything is derived from a PatientSessionState so the
 * logic is unit-testable and never branches on condition names or patient ids.
 */
import type { ActionItem, ChatMessage, PatientSessionState } from "@/lib/types";
import { isUnverifiedClinicianItem } from "@/lib/store/selectors";
import { compareDates, daysUntil, parseDate } from "@/lib/utils/dates";

/**
 * "From your care team": pending, verified, clinician-documented care-plan
 * items. AI suggestions and unverified items are deliberately excluded so a
 * suggestion is never presented as an instruction (ARCHITECTURE §2.4–2.5).
 */
export function careTeamTasks(actions: ActionItem[]): ActionItem[] {
  return actions.filter(
    (a) =>
      a.category === "care_plan" &&
      a.origin === "clinician_documented" &&
      a.sourceVerification === "verified" &&
      a.status === "pending",
  );
}

export type UpcomingKind = "reminder" | "due";

export interface UpcomingItem {
  action: ActionItem;
  kind: UpcomingKind;
  /** ISO date or date-time that drives ordering. */
  at: string;
  /** Whole days from `now` (negative = overdue). */
  daysAway: number;
  isToday: boolean;
  isOverdue: boolean;
}

/**
 * Today's reminders and upcoming due dates, soonest first. Completed items,
 * dismissed reminders and unverified clinician items are excluded. When an
 * action has both a reminder and a due date, the earlier one is used.
 */
export function upcomingItems(actions: ActionItem[], now: Date = new Date()): UpcomingItem[] {
  const out: UpcomingItem[] = [];
  for (const action of actions) {
    if (action.status === "completed" || isUnverifiedClinicianItem(action)) continue;
    const candidates: { kind: UpcomingKind; at: string }[] = [];
    if (action.reminder && !action.reminder.dismissed && parseDate(action.reminder.at)) {
      candidates.push({ kind: "reminder", at: action.reminder.at });
    }
    if (action.dueDate && parseDate(action.dueDate)) {
      candidates.push({ kind: "due", at: action.dueDate });
    }
    if (candidates.length === 0) continue;
    candidates.sort((a, b) => compareDates(a.at, b.at));
    const pick = candidates[0];
    const daysAway = daysUntil(pick.at, now) ?? 0;
    out.push({ action, ...pick, daysAway, isToday: daysAway === 0, isOverdue: daysAway < 0 });
  }
  return out.sort((a, b) => compareDates(a.at, b.at));
}

export interface GoalProgress {
  completed: number;
  total: number;
  /** 0..100, or null when there are no goals (render an empty state, not 0%). */
  percent: number | null;
}

/** Completed / total "My Wellness Goals" items. */
export function wellnessGoalProgress(actions: ActionItem[]): GoalProgress {
  const goals = actions.filter((a) => a.category === "wellness_goal" && !isUnverifiedClinicianItem(a));
  const completed = goals.filter((a) => a.status === "completed").length;
  const total = goals.length;
  return { completed, total, percent: total === 0 ? null : Math.round((completed / total) * 100) };
}

export interface RecentQuestions {
  /** Last `limit` user chat messages, newest first. */
  recentChat: ChatMessage[];
  /** Questions saved for the next appointment. */
  saved: string[];
}

export function recentQuestions(
  chat: ChatMessage[],
  savedQuestions: string[],
  limit = 3,
): RecentQuestions {
  const recentChat = chat
    .filter((m) => m.role === "user" && m.content.trim().length > 0)
    .slice(-limit)
    .reverse();
  return { recentChat, saved: savedQuestions.filter((q) => q.trim().length > 0) };
}

/** True once the active document (or any document) has an interpretation. */
export function hasInterpretedDocument(session: PatientSessionState): boolean {
  if (session.activeDocumentId && session.interpretations[session.activeDocumentId]) return true;
  return Object.keys(session.interpretations).length > 0;
}

/** Teach-back sessions completed vs started (for the progress card). */
export function teachBackProgress(session: PatientSessionState): { completed: number; total: number } {
  const all = Object.values(session.teachBack);
  return { completed: all.filter((s) => s.completed).length, total: all.length };
}
