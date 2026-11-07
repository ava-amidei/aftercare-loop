import { describe, expect, it } from "vitest";
import type { ExtractedInstruction, VisitDocument } from "@/lib/types";
import { citationProblem, runCitationSuite } from "./citations";

const doc: VisitDocument = {
  id: "doc-c",
  patientId: "pt-c",
  title: "Fictional",
  text: "Take one tablet daily. Return in 2 weeks.",
  createdAt: "2026-01-01",
  source: "fixture",
};
const q = "Return in 2 weeks.";
const start = doc.text.indexOf(q);

const valid: ExtractedInstruction = {
  description: "Return in 2 weeks",
  type: "appointment",
  sourceVerification: "verified",
  sourceRef: { documentId: doc.id, start, end: start + q.length, quote: q },
};

describe("citationProblem", () => {
  it("accepts an exact slice", () => expect(citationProblem(doc, valid)).toBeNull());
  it("rejects shifted offsets, wrong document, out-of-range and missing refs", () => {
    expect(citationProblem(doc, { ...valid, sourceRef: { ...valid.sourceRef!, start: start - 1, end: start - 1 + q.length } })).toMatch(/does not equal/);
    expect(citationProblem(doc, { ...valid, sourceRef: { ...valid.sourceRef!, documentId: "other" } })).toMatch(/documentId/);
    expect(citationProblem(doc, { ...valid, sourceRef: { ...valid.sourceRef!, end: 9999 } })).toMatch(/out of range/);
    expect(citationProblem(doc, { ...valid, sourceRef: undefined })).toMatch(/no sourceRef/);
  });
});

describe("runCitationSuite", () => {
  it("counts verified vs invalid and leaves unverified out of the rate", () => {
    const invalid = { ...valid, sourceRef: { ...valid.sourceRef!, quote: "Return in 3 weeks." } };
    const unverified: ExtractedInstruction = { description: "Something", type: "other", sourceVerification: "unverified" };
    const r = runCitationSuite([{ patientId: "pt-c", document: doc, instructions: [valid, invalid, unverified] }]);
    expect([r.verifiedCount, r.validCount, r.invalidCount, r.unverifiedCount]).toEqual([2, 1, 1, 1]);
    const rate = r.metrics.find((m) => m.name === "Citation validity rate")!;
    expect(rate).toMatchObject({ numerator: 1, denominator: 2, value: 0.5 });
    expect(r.cases.map((c) => c.passed)).toEqual([true, false]);
  });

  it("no verified citations → rate Not evaluated", () => {
    const r = runCitationSuite([]);
    expect(r.metrics.every((m) => m.value === null)).toBe(true);
  });
});
