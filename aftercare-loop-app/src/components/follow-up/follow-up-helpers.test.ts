import { describe, expect, it } from "vitest";
import type { ActionItem, CommunicationSummary } from "@/lib/types";
import {
  PATIENT_REQUEST_TYPES,
  buildFormRequest,
  buildSummaryRequest,
  findActionForLine,
  isSummaryEmpty,
  questionOrigin,
} from "./follow-up-helpers";

const NOW = "2026-11-07T12:00:00.000Z";

function action(p: Partial<ActionItem> & Pick<ActionItem, "id" | "description">): ActionItem {
  return {
    patientId: "pt-x",
    type: "other",
    category: "care_plan",
    origin: "clinician_documented",
    sourceVerification: "verified",
    status: "pending",
    rationale: "test",
    createdAt: NOW,
    updatedAt: NOW,
    ...p,
  };
}

describe("findActionForLine", () => {
  const actions = [
    action({ id: "a1", description: "Schedule a blood test" }),
    action({ id: "a2", description: "Schedule a blood test within 2 weeks" }),
    action({ id: "a3", description: "Ask about rides", origin: "ai_suggested" }),
  ];
  it("matches exact lines and lines with trailing notes, preferring the longest description", () => {
    expect(findActionForLine("Ask about rides", actions)?.id).toBe("a3");
    expect(findActionForLine("Schedule a blood test within 2 weeks (due Nov 20, 2026)", actions)?.id).toBe("a2");
    expect(findActionForLine("Schedule a blood test (needs clarification)", actions)?.id).toBe("a1");
  });
  it("does not match unrelated or partial-word lines", () => {
    expect(findActionForLine("Schedule a blood testing kit", actions)).toBeUndefined();
    expect(findActionForLine("Something else", actions)).toBeUndefined();
  });
});

describe("questionOrigin", () => {
  const actions = [
    action({ id: "q1", description: "Is telehealth available?", category: "provider_question", origin: "ai_suggested" }),
  ];
  it("labels saved questions as patient-selected and action questions by their origin", () => {
    expect(questionOrigin("my own question", ["My own question"], actions)).toBe("patient_selected");
    expect(questionOrigin("Is telehealth available?", [], actions)).toBe("ai_suggested");
  });

  it("keeps saved barrier suggestions labeled as suggested by Kat", () => {
    const prompt =
      "Would you like to ask your clinic whether transportation assistance or a telehealth appointment is available?";
    const clinic = "Is transportation assistance or a telehealth appointment available for my follow-up care?";
    const barrierAction = action({
      id: "b1",
      description: prompt,
      category: "provider_question",
      origin: "ai_suggested",
      addressesBarrier: "transportation",
    });
    expect(questionOrigin(clinic, [clinic], [barrierAction])).toBe("ai_suggested");
    expect(questionOrigin(clinic, [], [barrierAction])).toBe("ai_suggested");
    expect(questionOrigin("my own question", ["my own question"], [barrierAction])).toBe("patient_selected");
  });
});

describe("isSummaryEmpty", () => {
  const base: CommunicationSummary = {
    patientId: "pt-x",
    generatedAt: NOW,
    questions: [],
    barriers: [],
    unresolvedItems: [],
    documentedInstructions: [],
    text: "x",
  };
  it("is true only when every section is empty", () => {
    expect(isSummaryEmpty(base)).toBe(true);
    expect(isSummaryEmpty({ ...base, barriers: ["transportation"] })).toBe(false);
  });
});

describe("request builders", () => {
  it("builds a simulated clarification request carrying the summary text", () => {
    const req = buildSummaryRequest({ patientId: "pt-x", text: "  Notes  ", summaryLine: "Prep", now: NOW });
    expect(req).toMatchObject({
      patientId: "pt-x",
      type: "clarification",
      summary: "Prep",
      details: "Notes",
      status: "submitted",
      simulated: true,
    });
    expect(buildSummaryRequest({ patientId: "pt-x", text: "   ", summaryLine: "Prep" })).toBeNull();
  });

  it("builds form requests with optional related action and rejects blank summaries", () => {
    expect(buildFormRequest({ patientId: "pt-x", type: "refill_request", summary: " ", now: NOW })).toBeNull();
    const r = buildFormRequest({ patientId: "pt-x", type: "refill_request", summary: "Need refill", relatedActionId: "", now: NOW });
    expect(r?.relatedActionId).toBeUndefined();
    const r2 = buildFormRequest({ patientId: "pt-x", type: "side_effect_question", summary: "Q", relatedActionId: "a1", now: NOW });
    expect(r2).toMatchObject({ type: "side_effect_question", relatedActionId: "a1", simulated: true });
  });

  it("offers exactly the four patient-facing request types", () => {
    expect(PATIENT_REQUEST_TYPES).toEqual(["clarification", "refill_request", "side_effect_question", "reported_barrier"]);
  });
});
