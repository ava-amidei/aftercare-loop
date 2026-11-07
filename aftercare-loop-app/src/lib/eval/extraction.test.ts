import { describe, expect, it } from "vitest";
import type { ExtractedInstruction, PatientGroundTruth, PatientProfile, VisitDocument } from "@/lib/types";
import { extractedSpan, locateSpan, matchInstructions, runExtractionSuite } from "./extraction";

const text = [
  "Plan:",
  "Take the tablet once daily with water.",
  "Book a follow-up visit in 6 weeks.",
  "Walk for 20 minutes most days.",
  "Call us if the rash spreads.",
].join("\n");

const doc: VisitDocument = {
  id: "doc-test-1",
  patientId: "pt-test",
  title: "Fictional test summary",
  text,
  createdAt: "2026-01-01",
  source: "fixture",
};

const profile = { id: "pt-test", language: "en" } as PatientProfile;

function ref(quote: string) {
  const start = text.indexOf(quote);
  return { documentId: doc.id, start, end: start + quote.length, quote };
}

function item(description: string, quote?: string): ExtractedInstruction {
  return {
    description,
    type: "other",
    sourceRef: quote ? ref(quote) : undefined,
    sourceVerification: quote ? "verified" : "unverified",
  };
}

const gt: PatientGroundTruth = {
  patientId: "pt-test",
  documentId: doc.id,
  expectedKeyFacts: [],
  expectedInstructions: [
    { description: "Take the tablet once daily", type: "medication", quote: "Take the tablet once daily with water.", acceptedDescriptions: [] },
    { description: "Follow-up visit in 6 weeks", type: "appointment", quote: "Book a follow-up visit in 6 weeks.", acceptedDescriptions: ["Book 6-week follow-up"] },
    { description: "Walk 20 minutes most days", type: "lifestyle", quote: "Walk for 20 minutes most days.", acceptedDescriptions: [] },
  ],
  optionalInstructionQuotes: ["Call us if the rash spreads."],
  forbiddenActions: [],
  requiredReferenceTopics: [],
  teachBackQuestions: [],
  safetyConsiderations: [],
};

describe("span helpers", () => {
  it("locates exact and whitespace/case-tolerant quotes", () => {
    expect(locateSpan(text, "Book a follow-up visit in 6 weeks.")).toEqual({ start: ref("Book a follow-up visit in 6 weeks.").start, end: ref("Book a follow-up visit in 6 weeks.").end });
    const loose = locateSpan(text, "book a   FOLLOW-UP visit");
    expect(loose && text.slice(loose.start, loose.end)).toBe("Book a follow-up visit");
    expect(locateSpan(text, "not in the document")).toBeNull();
  });

  it("does not trust offsets that disagree with the quote", () => {
    const bad = { ...item("x", "Walk for 20 minutes most days."), sourceRef: { ...ref("Walk for 20 minutes most days."), start: 0, end: 5 } };
    expect(extractedSpan(doc, bad)).toEqual({ start: ref("Walk for 20 minutes most days.").start, end: ref("Walk for 20 minutes most days.").end });
  });
});

describe("matchInstructions", () => {
  it("matches by span overlap and by description similarity, one-to-one", () => {
    const extracted = [
      item("Medication instruction", "Take the tablet once daily"), // span overlap (partial quote)
      item("Book 6-week follow-up"), // no quote, description match
      item("Take the tablet once daily", "Take the tablet once daily with water."), // duplicate → FP
      item("Call us if the rash spreads", "Call us if the rash spreads."), // optional → excluded
      item("Drink 3 liters of juice"), // fabricated → FP
    ];
    const r = matchInstructions(doc, gt.expectedInstructions, extracted, gt.optionalInstructionQuotes);
    expect(r.confusion).toEqual({ truePositives: 2, falsePositives: 2, falseNegatives: 1 });
    expect(r.matches.map((m) => [m.expectedIndex, m.basis])).toEqual([
      [0, "span_overlap"],
      [1, "description_similarity"],
    ]);
    expect(r.optionalIndexes).toEqual([3]);
    expect(r.falsePositiveIndexes).toEqual(expect.arrayContaining([4]));
    expect(r.falseNegativeIndexes).toEqual([2]);
  });

  it("prefers the full-span duplicate over a partial one when both overlap", () => {
    const extracted = [item("a", "Take the tablet"), item("b", "Take the tablet once daily with water.")];
    const r = matchInstructions(doc, gt.expectedInstructions.slice(0, 1), extracted);
    expect(r.matches[0]!.extractedIndex).toBe(1);
    expect(r.falsePositiveIndexes).toEqual([0]);
  });
});

describe("runExtractionSuite", () => {
  it("aggregates TP/FP/FN and excludes errored cases from metrics", async () => {
    const ok = { profile, document: doc, groundTruth: gt };
    const broken = { profile, document: { ...doc, id: "doc-broken" }, groundTruth: { ...gt, patientId: "pt-broken", documentId: "doc-broken" } };
    const result = await runExtractionSuite([ok, broken], async ({ document }) => {
      if (document.id === "doc-broken") throw new Error("boom");
      return {
        instructions: gt.expectedInstructions.map((e) => item(e.description, e.quote)),
        source: "heuristic",
      };
    });
    expect(result.confusion).toEqual({ truePositives: 3, falsePositives: 0, falseNegatives: 0 });
    expect(result.errors).toEqual(["extraction:pt-broken: Error: boom"]);
    expect(result.cases.map((c) => c.passed)).toEqual([true, false]);
    const byName = Object.fromEntries(result.metrics.map((m) => [m.name, m]));
    expect(byName["Patients evaluated"]).toMatchObject({ numerator: 1, denominator: 2 });
    expect(byName["Precision"]).toMatchObject({ numerator: 3, denominator: 3, value: 1 });
    expect(byName["Recall"]).toMatchObject({ numerator: 3, denominator: 3, value: 1 });
    expect(result.perPatient[0]!.source).toBe("heuristic");
  });

  it("zero cases → every metric Not evaluated", async () => {
    const result = await runExtractionSuite([], async () => []);
    expect(result.metrics.every((m) => m.value === null)).toBe(true);
  });
});
