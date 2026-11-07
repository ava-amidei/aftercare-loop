// @vitest-environment node
import { describe, expect, it } from "vitest";
import { sectionSentences, splitSentences, suggestBarrierQuestions, runQuickPrompt } from "./quick-prompts";
import { getDocuments, getPatient } from "@/data/patients";

describe("splitSentences", () => {
  it("does not split decimals or abbreviations without a following space", () => {
    const text = "Your hemoglobin was 10.2 g/dL. Iron was low! Recheck in 6 weeks";
    const spans = splitSentences(text).map((s) => text.slice(s.start, s.end));
    expect(spans).toEqual(["Your hemoglobin was 10.2 g/dL.", "Iron was low!", "Recheck in 6 weeks"]);
  });
});

describe("sectionSentences", () => {
  it("returns exact, verifiable offsets for every fixture document", () => {
    for (const p of ["pt-a-pcos", "pt-b-postpartum", "pt-f-gdm-es", "pt-l-t2d-htn"]) {
      const doc = getDocuments(p)[0]!;
      const refs = sectionSentences(doc, /./);
      expect(refs.length).toBeGreaterThan(0);
      for (const r of refs) expect(doc.text.slice(r.start, r.end)).toBe(r.quote);
      // headings themselves are never returned as sentences
      for (const s of doc.sections ?? []) expect(refs.some((r) => r.quote === s.heading)).toBe(false);
    }
  });
});

describe("suggestBarrierQuestions", () => {
  it("phrases questions without assuming availability, in the requested language", () => {
    const en = suggestBarrierQuestions(["transportation", "caregiving", "transportation"], "en");
    expect(en.map((q) => q.barrier)).toEqual(["transportation", "caregiving"]);
    for (const q of en) expect(q.question).toMatch(/^Would you like to ask your (clinic|care team)/);
    const es = suggestBarrierQuestions(["language"], "es");
    for (const q of es) expect(q.question).toMatch(/^¿Le gustaría preguntarle/);
    expect(suggestBarrierQuestions([], "en")).toEqual([]);
  });
});

describe("runQuickPrompt", () => {
  it("returns null for free text", () => {
    const ctx = { profile: getPatient("pt-a-pcos")!, actions: [], savedQuestions: [] };
    expect(runQuickPrompt("free_text", ctx)).toBeNull();
    expect(runQuickPrompt(undefined, ctx)).toBeNull();
  });
});
