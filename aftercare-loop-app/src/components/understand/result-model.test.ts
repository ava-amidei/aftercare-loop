import { describe, expect, it } from "vitest";
import { references } from "@/data/evidence";
import type { EvidenceReference, ExtractedInstruction } from "@/lib/types";
import {
  collectReferenceIds,
  discussionItems,
  isSafeHttpUrl,
  isSavedQuestion,
  partitionInstructions,
  resolveReferences,
  sortSafetyFlags,
} from "./result-model";

const doc = { id: "d1", text: "Intro. Get a blood test in 2 weeks. Bye." };
const q = "Get a blood test in 2 weeks.";
const start = doc.text.indexOf(q);
const good: ExtractedInstruction = {
  description: "Blood test",
  type: "test_or_lab",
  sourceVerification: "verified",
  sourceRef: { documentId: "d1", start, end: start + q.length, quote: q },
};

describe("partitionInstructions", () => {
  it("only keeps server-verified instructions whose offsets re-check", () => {
    const claimedButWrong: ExtractedInstruction = {
      ...good,
      description: "Shifted",
      sourceRef: { ...good.sourceRef!, start: start + 1, end: start + 1 + q.length },
    };
    const unverified: ExtractedInstruction = {
      description: "Made up",
      type: "other",
      sourceVerification: "unverified",
      unverifiedQuote: "Take vitamin X.",
    };
    const verifiedNoRef: ExtractedInstruction = { description: "No ref", type: "other", sourceVerification: "verified" };
    const { verified, needsClarification } = partitionInstructions(
      [good, claimedButWrong, unverified, verifiedNoRef],
      doc,
    );
    expect(verified.map((i) => i.description)).toEqual(["Blood test"]);
    expect(needsClarification.map((i) => i.description)).toEqual(["Shifted", "Made up", "No ref"]);
  });
});

describe("resolveReferences", () => {
  it("returns curated references only, de-duplicated, and reports unknown ids", () => {
    const known = references[0]!.id;
    const out = resolveReferences([known, known, "ref-does-not-exist"]);
    expect(out.references.map((r) => r.id)).toEqual([known]);
    expect(out.missing).toEqual(["ref-does-not-exist"]);
  });
  it("drops references with non-http(s) URLs", () => {
    const bad = { ...references[0]!, id: "x", url: "javascript:alert(1)" } as EvidenceReference;
    expect(resolveReferences(["x"], () => bad).references).toEqual([]);
    expect(isSafeHttpUrl("https://medlineplus.gov/")).toBe(true);
    expect(isSafeHttpUrl("not a url")).toBe(false);
  });
  it("every curated reference has a valid link", () => {
    expect(resolveReferences(references.map((r) => r.id)).missing).toEqual([]);
  });
});

describe("collectReferenceIds / discussionItems / sortSafetyFlags / isSavedQuestion", () => {
  it("collects top-level and term reference ids in order", () => {
    expect(
      collectReferenceIds({
        referenceIds: ["a", "b"],
        terms: [{ term: "t", definition: "d", referenceIds: ["b", "c"] }],
      }),
    ).toEqual(["a", "b", "c"]);
  });
  it("de-duplicates discussion questions across both lists", () => {
    expect(
      discussionItems({
        discussWithProvider: ["What is next?", " what is next? ", ""],
        unansweredQuestions: ["What is NEXT?", "How long?"],
      }),
    ).toEqual({ suggested: ["What is next?"], unanswered: ["How long?"] });
  });
  it("sorts safety flags most severe first", () => {
    expect(
      sortSafetyFlags([
        { level: "info", message: "i" },
        { level: "urgent", message: "u" },
        { level: "clarify_with_clinician", message: "c" },
      ]).map((f) => f.level),
    ).toEqual(["urgent", "clarify_with_clinician", "info"]);
  });
  it("matches saved questions case-insensitively", () => {
    expect(isSavedQuestion(["Ask about labs"], " ask about LABS ")).toBe(true);
    expect(isSavedQuestion([], "x")).toBe(false);
  });
});
