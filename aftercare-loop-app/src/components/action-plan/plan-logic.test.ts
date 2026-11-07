import { describe, expect, it } from "vitest";
import type { ActionItem, PatientSessionState } from "@/lib/types";
import {
  buildActionPlanRequest,
  createPatientAction,
  dateTimeLocalToIso,
  dueReminders,
  groupActionPlan,
  parseActionPlanResponse,
  sectionCounts,
  toDateTimeLocalValue,
} from "./plan-logic";

const NOW = "2026-11-07T12:00:00.000Z";

function item(over: Partial<ActionItem>): ActionItem {
  return {
    id: over.id ?? "a",
    patientId: "pt-test",
    description: "Fictional step",
    type: "other",
    category: "care_plan",
    origin: "clinician_documented",
    sourceVerification: "verified",
    status: "pending",
    rationale: "Fictional rationale",
    createdAt: NOW,
    updatedAt: NOW,
    ...over,
  };
}

describe("groupActionPlan", () => {
  it("keeps only verified clinician items in My Care Plan and separates suggestions", () => {
    const actions = [
      item({ id: "care" }),
      item({ id: "unverified-clin", sourceVerification: "unverified" }),
      item({
        id: "clarify",
        origin: "ai_suggested",
        category: "provider_question",
        sourceVerification: "unverified",
        status: "needs_clarification",
      }),
      item({ id: "goal", category: "wellness_goal", origin: "patient_selected", sourceVerification: "not_applicable" }),
      item({ id: "q", category: "provider_question", origin: "ai_suggested", sourceVerification: "not_applicable" }),
      item({
        id: "barrier",
        category: "provider_question",
        origin: "ai_suggested",
        type: "administrative",
        sourceVerification: "not_applicable",
        addressesBarrier: "transportation",
      }),
      // A mislabeled AI item in care_plan must never be shown as an instruction.
      item({ id: "ai-in-care", origin: "ai_suggested", sourceVerification: "not_applicable" }),
    ];
    const g = groupActionPlan(actions);
    expect(g.carePlan.map((a) => a.id)).toEqual(["care"]);
    expect(g.needsClarification.map((a) => a.id)).toEqual(["unverified-clin", "clarify"]);
    expect(g.wellness.map((a) => a.id)).toEqual(["goal"]);
    expect(g.questions.map((a) => a.id)).toEqual(["q", "ai-in-care"]);
    expect(g.barrierSuggestions.map((a) => a.id)).toEqual(["barrier"]);
    expect(sectionCounts(g)).toEqual({ care_plan: 1, wellness_goal: 1, provider_question: 4 });
  });
});

describe("createPatientAction", () => {
  it("creates a patient-selected item with no source", () => {
    const a = createPatientAction({
      patientId: "pt-test",
      description: "  Walk   after dinner ",
      category: "wellness_goal",
      rationale: "Chosen by you",
      now: NOW,
      id: "own-1",
    });
    expect(a).toMatchObject({
      id: "own-1",
      description: "Walk after dinner",
      origin: "patient_selected",
      category: "wellness_goal",
      sourceVerification: "not_applicable",
      status: "pending",
    });
    expect(a?.sourceRef).toBeUndefined();
    const q = createPatientAction({ patientId: "p", description: "Why?", category: "provider_question", rationale: "r" });
    expect(q?.type).toBe("question_for_provider");
    expect(createPatientAction({ patientId: "p", description: "   ", category: "provider_question", rationale: "r" })).toBeNull();
  });
});

describe("dueReminders", () => {
  const now = new Date(NOW);
  const at = (h: number) => new Date(now.getTime() + h * 3_600_000).toISOString();
  it("returns active reminders due within 24h (including overdue), earliest first", () => {
    const actions = [
      item({ id: "later", reminder: { at: at(30), label: "later", dismissed: false } }),
      item({ id: "soon", reminder: { at: at(5), label: "soon", dismissed: false } }),
      item({ id: "overdue", reminder: { at: at(-2), label: "overdue", dismissed: false } }),
      item({ id: "dismissed", reminder: { at: at(1), label: "x", dismissed: true } }),
      item({ id: "done", status: "completed", reminder: { at: at(1), label: "x", dismissed: false } }),
      item({ id: "bad", reminder: { at: "not a date", label: "x", dismissed: false } }),
      item({ id: "none" }),
    ];
    expect(dueReminders(actions, now).map((r) => r.action.id)).toEqual(["overdue", "soon"]);
  });
});

describe("datetime-local helpers", () => {
  it("round-trips local values", () => {
    const d = new Date(2026, 10, 8, 9, 5);
    const v = toDateTimeLocalValue(d);
    expect(v).toBe("2026-11-08T09:05");
    expect(dateTimeLocalToIso(v)).toBe(d.toISOString());
    expect(dateTimeLocalToIso("")).toBeNull();
    expect(dateTimeLocalToIso("tomorrow")).toBeNull();
  });
});

describe("buildActionPlanRequest", () => {
  const profile = {
    id: "pt-test",
    displayName: "Fictional",
    ageRange: "30–39",
    language: "en" as const,
    explanationLevel: "simple" as const,
    accessibility: [],
    conditions: [],
    medications: [],
    careInstructions: [],
    healthGoals: [],
    barriers: [],
    scenarioSummary: "Fictional",
  };
  const base: PatientSessionState = {
    profile,
    documents: [
      { id: "doc-f", patientId: "pt-test", title: "Fixture", text: "abc", createdAt: NOW, source: "fixture" },
      { id: "doc-p", patientId: "pt-test", title: "Pasted", text: "xyz", createdAt: NOW, source: "pasted" },
    ],
    interpretations: {},
    actions: [item({ id: "x", patientId: "pt-test" })],
    chat: [],
    teachBack: {},
    careTeamRequests: [],
    savedQuestions: [],
  };

  it("returns null without an active document", () => {
    expect(buildActionPlanRequest(base)).toBeNull();
  });

  it("omits fixture document text but sends pasted documents", () => {
    const f = buildActionPlanRequest({ ...base, activeDocumentId: "doc-f" });
    expect(f).toMatchObject({ patientId: "pt-test", documentId: "doc-f", interpretation: null });
    expect(f?.document).toBeUndefined();
    expect(f?.existing).toHaveLength(1);
    const p = buildActionPlanRequest({ ...base, activeDocumentId: "doc-p" });
    expect(p?.document?.id).toBe("doc-p");
  });
});

describe("parseActionPlanResponse", () => {
  it("rejects malformed responses", () => {
    expect(() => parseActionPlanResponse(null)).toThrow();
    expect(() => parseActionPlanResponse({ actions: "no" })).toThrow();
    expect(parseActionPlanResponse({ actions: [] })).toEqual([]);
  });
});
