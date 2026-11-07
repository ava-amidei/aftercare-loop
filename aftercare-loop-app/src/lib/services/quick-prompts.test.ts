// @vitest-environment node
import { describe, expect, it } from "vitest";
import { sectionSentences, splitSentences, suggestBarrierQuestions, runQuickPrompt } from "./quick-prompts";
import { getDocuments, getPatient } from "@/data/patients";
import { interpretDocument } from "./document-interpreter";

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
    // The savable wording is addressed to the clinic, not to the patient.
    for (const q of [...en, ...es]) {
      expect(q.clinicQuestion).not.toMatch(/^(would you like|¿le gustaría)/i);
      expect(q.clinicQuestion).toMatch(/\?$/);
    }
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

describe("explain_my_diagnosis with a heuristic (no-narrative) interpretation", () => {
  // Scripted mode with no prepared content → interpretDocument's heuristic result,
  // whose whatThisMeans is a service note ("…the next steps below…"), not an explanation.
  for (const id of ["pt-g-hypothyroid", "pt-f-gdm-es", "pt-i-anemia-es"]) {
    it(`${id}: quotes the documented assessment instead of the service note`, async () => {
      const profile = getPatient(id)!;
      const document = getDocuments(id)[0]!;
      const interpretation = await interpretDocument(
        { profile, document, evidence: [] },
        { mode: "scripted_demo", scripted: () => null },
      );
      expect(interpretation.meta.generatedBy).toBe("deterministic");
      const out = runQuickPrompt("explain_my_diagnosis", {
        profile,
        document,
        interpretation,
        actions: [],
        savedQuestions: [],
      })!;
      expect(out.content).not.toContain(interpretation.whatThisMeans);
      expect(out.content).not.toMatch(/in plain language:|en palabras sencillas:/);
      expect(out.content).not.toMatch(/Understand My Health|Entender mi salud/);
      expect(out.sourceRefs.length).toBeGreaterThan(0);
      for (const r of out.sourceRefs) expect(document.text.slice(r.start, r.end)).toBe(r.quote);
    });
  }

  it("still uses a generated narrative when one exists", async () => {
    const id = "pt-g-hypothyroid";
    const profile = getPatient(id)!;
    const document = getDocuments(id)[0]!;
    const heuristic = await interpretDocument(
      { profile, document, evidence: [] },
      { mode: "scripted_demo", scripted: () => null },
    );
    const interpretation = {
      ...heuristic,
      whatThisMeans: "Synthetic test narrative.",
      meta: { ...heuristic.meta, generatedBy: "scripted" as const },
    };
    const out = runQuickPrompt("explain_my_diagnosis", {
      profile,
      document,
      interpretation,
      actions: [],
      savedQuestions: [],
    })!;
    expect(out.content).toContain("Synthetic test narrative.");
  });
});
