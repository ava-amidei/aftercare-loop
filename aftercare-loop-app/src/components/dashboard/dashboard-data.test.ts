import { describe, expect, it } from "vitest";
import type { ActionItem, ChatMessage, PatientSessionState } from "@/lib/types";
import {
  careTeamTasks,
  hasInterpretedDocument,
  recentQuestions,
  teachBackProgress,
  upcomingItems,
  wellnessGoalProgress,
} from "./dashboard-data";

const base: ActionItem = {
  id: "a",
  patientId: "pt-x",
  description: "Fictional task",
  type: "appointment",
  category: "care_plan",
  origin: "clinician_documented",
  sourceVerification: "verified",
  sourceRef: { documentId: "d", start: 0, end: 4, quote: "Test" },
  status: "pending",
  rationale: "test",
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
};
const mk = (patch: Partial<ActionItem>): ActionItem => ({ ...base, ...patch });

const msg = (id: string, role: ChatMessage["role"], content: string): ChatMessage => ({
  id,
  role,
  content,
  createdAt: "2026-11-01T00:00:00.000Z",
});

describe("careTeamTasks", () => {
  it("keeps only pending, verified, clinician-documented care-plan items", () => {
    const items = [
      mk({ id: "ok" }),
      mk({ id: "done", status: "completed" }),
      mk({ id: "unverified", sourceVerification: "unverified" }),
      mk({ id: "ai", origin: "ai_suggested", sourceVerification: "not_applicable", type: "administrative" }),
      mk({ id: "goal", category: "wellness_goal", origin: "patient_selected" }),
      mk({ id: "clarify", status: "needs_clarification" }),
    ];
    expect(careTeamTasks(items).map((a) => a.id)).toEqual(["ok"]);
  });
});

describe("upcomingItems", () => {
  const now = new Date(2026, 10, 7, 9, 0, 0); // Nov 7 2026 local

  it("sorts soonest first and flags today / overdue", () => {
    const items = [
      mk({ id: "later", dueDate: "2026-12-15" }),
      mk({ id: "today", reminder: { at: new Date(2026, 10, 7, 18).toISOString(), label: "Take note", dismissed: false } }),
      mk({ id: "past", dueDate: "2026-11-01" }),
      mk({ id: "none" }),
    ];
    const out = upcomingItems(items, now);
    expect(out.map((u) => u.action.id)).toEqual(["past", "today", "later"]);
    expect(out[0].isOverdue).toBe(true);
    expect(out[1]).toMatchObject({ kind: "reminder", isToday: true, isOverdue: false });
    expect(out[2]).toMatchObject({ kind: "due", isToday: false });
  });

  it("excludes completed, dismissed and unverified items and picks the earlier date", () => {
    const items = [
      mk({ id: "done", status: "completed", dueDate: "2026-11-08" }),
      mk({ id: "dismissed", reminder: { at: "2026-11-08T10:00:00.000Z", label: "x", dismissed: true } }),
      mk({ id: "unverified", sourceVerification: "unverified", dueDate: "2026-11-08" }),
      mk({
        id: "both",
        dueDate: "2026-11-20",
        reminder: { at: new Date(2026, 10, 10, 8).toISOString(), label: "r", dismissed: false },
      }),
      mk({ id: "bad-date", dueDate: "not-a-date" }),
    ];
    const out = upcomingItems(items, now);
    expect(out.map((u) => u.action.id)).toEqual(["both"]);
    expect(out[0].kind).toBe("reminder");
    expect(out[0].daysAway).toBe(3);
  });
});

describe("wellnessGoalProgress", () => {
  it("returns null percent with no goals (never a fake 0%)", () => {
    expect(wellnessGoalProgress([mk({})])).toEqual({ completed: 0, total: 0, percent: null });
  });
  it("counts completed / total wellness goals", () => {
    const goals = [
      mk({ id: "g1", category: "wellness_goal", origin: "patient_selected", status: "completed" }),
      mk({ id: "g2", category: "wellness_goal", origin: "patient_selected" }),
      mk({ id: "g3", category: "wellness_goal", origin: "patient_selected" }),
      mk({ id: "c1" }),
    ];
    expect(wellnessGoalProgress(goals)).toEqual({ completed: 1, total: 3, percent: 33 });
  });
});

describe("recentQuestions", () => {
  it("returns the last three user messages newest first plus saved questions", () => {
    const chat = [
      msg("1", "user", "first"),
      msg("2", "assistant", "reply"),
      msg("3", "user", "second"),
      msg("4", "user", "  "),
      msg("5", "user", "third"),
      msg("6", "user", "fourth"),
    ];
    const out = recentQuestions(chat, ["Saved one", ""]);
    expect(out.recentChat.map((m) => m.content)).toEqual(["fourth", "third", "second"]);
    expect(out.saved).toEqual(["Saved one"]);
  });
});

describe("session helpers", () => {
  const session = {
    activeDocumentId: "d1",
    interpretations: {},
    teachBack: {},
  } as unknown as PatientSessionState;

  it("hasInterpretedDocument reflects interpretations", () => {
    expect(hasInterpretedDocument(session)).toBe(false);
    expect(
      hasInterpretedDocument({ ...session, interpretations: { d1: {} } } as unknown as PatientSessionState),
    ).toBe(true);
  });

  it("teachBackProgress counts completed sessions", () => {
    const s = {
      ...session,
      teachBack: { q1: { completed: true }, q2: { completed: false } },
    } as unknown as PatientSessionState;
    expect(teachBackProgress(s)).toEqual({ completed: 1, total: 2 });
  });
});
