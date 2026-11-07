import { describe, expect, it } from "vitest";
import type { SafetyScenario, TeachBackQuestion } from "@/lib/types";
import {
  DEFAULT_PATIENT_ID,
  PRIMARY_PATIENT_IDS,
  documentsByPatient,
  getDocuments,
  getPatient,
  patientFixtures,
  patients,
} from "@/data/patients";
import { deriveSections, EN_HEADINGS, ES_HEADINGS, exactRef, slugify } from "@/data/patients/document-builder";
import { getGroundTruth, groundTruthByPatient, groundTruths, safetyTestCases } from "@/data/ground-truth";

const countWords = (s: string) => s.split(/\s+/).filter(Boolean).length;
const occurrences = (text: string, quote: string) => text.split(quote).length - 1;
const conceptHits = (concepts: string[], answer: string) =>
  concepts.filter((c) => answer.toLowerCase().includes(c.toLowerCase())).length;

describe("document-builder helpers", () => {
  it("derives section offsets from heading lines", () => {
    const text = "Header line\n\nAlpha\nbody one\n\nBeta\nbody two\n";
    const sections = deriveSections(text, ["Alpha", "Beta"]);
    expect(sections.map((s) => text.slice(s.start, s.end))).toEqual(["Alpha\nbody one", "Beta\nbody two"]);
    expect(sections.map((s) => s.id)).toEqual(["alpha", "beta"]);
  });

  it("slugifies accented headings", () => {
    expect(slugify("Cuándo buscar atención")).toBe("cuando-buscar-atencion");
    expect(slugify("Follow-up instructions")).toBe("follow-up-instructions");
  });

  it("exactRef throws for missing or ambiguous quotes", () => {
    const doc = patientFixtures[0].document;
    expect(() => exactRef(doc, "this sentence is not in the document")).toThrow(/not found/);
    expect(() => exactRef(doc, "metformin")).toThrow(/not unique/);
  });
});

describe("synthetic patient fixtures", () => {
  it("has 12 patients with unique ids, and the default is the PCOS demo", () => {
    expect(patients).toHaveLength(12);
    expect(new Set(patients.map((p) => p.id)).size).toBe(12);
    expect(getPatient(DEFAULT_PATIENT_ID)?.id).toBe("pt-a-pcos");
    expect(getPatient("nope")).toBeUndefined();
    expect(getDocuments("nope")).toEqual([]);
  });

  it("includes the five primary SPEC §6 scenarios with the required attributes", () => {
    expect(PRIMARY_PATIENT_IDS).toEqual([
      "pt-a-pcos",
      "pt-b-postpartum",
      "pt-c-endometriosis",
      "pt-d-pots",
      "pt-e-multi",
    ]);
    const a = getPatient("pt-a-pcos")!;
    expect(a).toMatchObject({ language: "en", explanationLevel: "standard", barriers: ["transportation"] });
    const b = getPatient("pt-b-postpartum")!;
    expect(b.explanationLevel).toBe("simple");
    expect([...b.barriers].sort()).toEqual(["caregiving", "transportation"]);
    const c = getPatient("pt-c-endometriosis")!;
    expect(c).toMatchObject({ explanationLevel: "detailed", barriers: ["scheduling"] });
    const d = getDocuments("pt-d-pots")[0].text;
    expect(d).toMatch(/liters of fluid/);
    expect(d).toMatch(/extra salt/);
    const e = getPatient("pt-e-multi")!;
    expect(e.conditions.length).toBeGreaterThanOrEqual(2);
    expect(e.barriers).toContain("cost_or_insurance");
    expect(getDocuments("pt-e-multi")[0].text).toMatch(/Limit your total fluids/);
    expect(getDocuments("pt-e-multi")[0].text).toMatch(/drink plenty of water/);
  });

  it("varies language, explanation level and accessibility", () => {
    const spanish = patients.filter((p) => p.language === "es");
    expect(spanish.length).toBeGreaterThanOrEqual(2);
    for (const p of spanish) {
      expect(getDocuments(p.id)[0].text).toContain(ES_HEADINGS.followUp);
    }
    expect(new Set(patients.map((p) => p.explanationLevel))).toEqual(new Set(["simple", "standard", "detailed"]));
    const prefs = new Set(patients.flatMap((p) => p.accessibility));
    expect(prefs).toEqual(new Set(["larger_text", "high_contrast", "reduced_motion", "screen_reader"]));
  });

  it("only carries pregnancy/postpartum context when the fictional record documents it", () => {
    for (const p of patients) {
      if (p.pregnancyOrPostpartumContext !== undefined) {
        expect(p.pregnancyOrPostpartumContext).toMatch(/^Document(ed|ado)/);
      }
    }
  });

  describe.each(patientFixtures.map((f) => [f.profile.id, f] as const))("%s document", (_id, fixture) => {
    const { profile, document: doc } = fixture;
    const headings = profile.language === "es" ? ES_HEADINGS : EN_HEADINGS;

    it("is a single fictional fixture document linked to the patient", () => {
      expect(documentsByPatient[profile.id]).toEqual([doc]);
      expect(doc.patientId).toBe(profile.id);
      expect(doc.source).toBe("fixture");
      expect(doc.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(doc.text).toMatch(/Fictional demonstration record|Registro ficticio de demostración/);
      expect(doc.text).toContain(profile.displayName);
    });

    it("is 300–700 words", () => {
      const n = countWords(doc.text);
      expect(n).toBeGreaterThanOrEqual(300);
      expect(n).toBeLessThanOrEqual(700);
    });

    it("has programmatically derived section offsets that match the text", () => {
      const sections = doc.sections!;
      expect(sections.map((s) => s.heading)).toEqual(Object.values(headings));
      // Independent derivation: composed blocks are separated by blank lines.
      const blocks = doc.text.trimEnd().split("\n\n").slice(1);
      expect(sections.map((s) => doc.text.slice(s.start, s.end))).toEqual(blocks);
      sections.forEach((s, i) => {
        expect(doc.text.slice(s.start, s.start + s.heading.length)).toBe(s.heading);
        expect(s.id).toBe(slugify(s.heading));
        if (i > 0) {
          expect(s.start).toBeGreaterThan(sections[i - 1].end);
          expect(doc.text.slice(sections[i - 1].end, s.start).trim()).toBe("");
        }
      });
    });
  });
});

describe("ground truth", () => {
  it("has exactly one record per patient", () => {
    expect(groundTruths).toHaveLength(patients.length);
    for (const p of patients) {
      const gt = getGroundTruth(p.id);
      expect(gt, p.id).toBeDefined();
      expect(gt!.documentId).toBe(getDocuments(p.id)[0].id);
    }
    expect(Object.keys(groundTruthByPatient).sort()).toEqual(patients.map((p) => p.id).sort());
  });

  const allQuestionIds = groundTruths.flatMap((g) => g.teachBackQuestions.map((q) => q.id));
  it("uses globally unique teach-back question ids", () => {
    expect(new Set(allQuestionIds).size).toBe(allQuestionIds.length);
  });

  describe.each(groundTruths.map((g) => [g.patientId, g] as const))("%s", (patientId, gt) => {
    const doc = getDocuments(patientId)[0];

    it("lists 3–5 expected instructions, each an exact, unique, standalone sentence of the document", () => {
      expect(gt.expectedInstructions.length).toBeGreaterThanOrEqual(3);
      expect(gt.expectedInstructions.length).toBeLessThanOrEqual(5);
      for (const ins of gt.expectedInstructions) {
        expect(doc.text.includes(ins.quote), ins.quote).toBe(true);
        expect(occurrences(doc.text, ins.quote), ins.quote).toBe(1);
        expect(doc.text).toContain(`- ${ins.quote}\n`);
        expect(ins.acceptedDescriptions.length).toBeGreaterThanOrEqual(1);
        if (ins.dueDate) expect(ins.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      expect(new Set(gt.expectedInstructions.map((i) => i.quote)).size).toBe(gt.expectedInstructions.length);
    });

    it("has optional instruction quotes that are exact substrings and distinct from expected ones", () => {
      const expected = new Set(gt.expectedInstructions.map((i) => i.quote));
      for (const q of gt.optionalInstructionQuotes ?? []) {
        expect(doc.text.includes(q), q).toBe(true);
        expect(expected.has(q)).toBe(false);
      }
    });

    it("has every bulleted instruction line covered by expectedInstructions", () => {
      const bullets = doc.text
        .split("\n")
        .filter((l) => l.startsWith("- "))
        .map((l) => l.slice(2));
      expect(bullets.sort()).toEqual(gt.expectedInstructions.map((i) => i.quote).sort());
    });

    it("has key facts, forbidden actions, lowercase reference topics and safety considerations", () => {
      expect(gt.expectedKeyFacts.length).toBeGreaterThanOrEqual(3);
      expect(gt.forbiddenActions.length).toBeGreaterThanOrEqual(3);
      expect(gt.safetyConsiderations.length).toBeGreaterThanOrEqual(1);
      expect(gt.requiredReferenceTopics.length).toBeGreaterThanOrEqual(1);
      for (const t of gt.requiredReferenceTopics) expect(t).toBe(t.toLowerCase());
    });

    it.each(gt.teachBackQuestions.map((q) => [q.id, q] as const))(
      "teach-back %s is grounded and self-consistent",
      (_qid, q: TeachBackQuestion) => {
        expect(q.patientId).toBe(patientId);
        expect(q.documentId).toBe(doc.id);
        // Exact source offsets.
        expect(q.sourceRef.documentId).toBe(doc.id);
        expect(doc.text.slice(q.sourceRef.start, q.sourceRef.end)).toBe(q.sourceRef.quote);
        const section = doc.sections!.find((s) => s.id === q.sourceRef.sectionId);
        expect(section).toBeDefined();
        expect(q.sourceRef.start).toBeGreaterThanOrEqual(section!.start);
        expect(q.sourceRef.end).toBeLessThanOrEqual(section!.end);

        expect(q.acceptedVariations.length).toBeGreaterThanOrEqual(4);
        expect(q.keyConcepts.length).toBeGreaterThanOrEqual(q.scoring.minKeyConceptsForCorrect);
        for (const c of q.keyConcepts) expect(c).toBe(c.toLowerCase());
        expect(q.scoring.minKeyConceptsForCorrect).toBeGreaterThanOrEqual(1);
        expect(q.scoring.misconceptions?.length ?? 0).toBeGreaterThanOrEqual(1);

        const choices = q.choices ?? [];
        expect(choices.filter((c) => c.correct)).toHaveLength(1);
        expect(choices.length).toBeGreaterThanOrEqual(3);

        const min = q.scoring.minKeyConceptsForCorrect;
        const correctAnswers = [q.expectedAnswer, ...q.acceptedVariations, ...choices.filter((c) => c.correct).map((c) => c.text)];
        for (const ans of correctAnswers) {
          expect(conceptHits(q.keyConcepts, ans), `correct answer "${ans}"`).toBeGreaterThanOrEqual(min);
          for (const m of q.scoring.misconceptions ?? []) {
            expect(ans.toLowerCase().includes(m.pattern.toLowerCase()), `"${ans}" vs misconception "${m.pattern}"`).toBe(
              false,
            );
          }
        }
        for (const wrong of choices.filter((c) => !c.correct)) {
          expect(conceptHits(q.keyConcepts, wrong.text), `wrong choice "${wrong.text}"`).toBeLessThan(min);
        }
      },
    );

    it("has 3 teach-back questions", () => {
      expect(gt.teachBackQuestions).toHaveLength(3);
    });
  });
});

describe("safety test cases", () => {
  const scenarios: SafetyScenario[] = [
    "chest_pain",
    "severe_breathing_difficulty",
    "stroke_symptoms",
    "severe_bleeding",
    "suicidal_ideation_or_self_harm",
    "severe_postpartum_warning",
  ];
  const spanish = /[áéíóúñ¿¡]|\b(tengo|quiero|estoy|pecho)\b/i;

  it("has ≥30 cases with unique ids", () => {
    expect(safetyTestCases.length).toBeGreaterThanOrEqual(30);
    expect(new Set(safetyTestCases.map((c) => c.id)).size).toBe(safetyTestCases.length);
  });

  it.each(scenarios)("%s has ≥4 emergency variants incl. a lowercase one and 911 guidance", (scenario) => {
    const cases = safetyTestCases.filter((c) => c.scenario === scenario);
    expect(cases.length).toBeGreaterThanOrEqual(4);
    expect(cases.some((c) => c.input === c.input.toLowerCase())).toBe(true);
    for (const c of cases) {
      expect(c.expectedLevel).toBe("emergency");
      expect(c.requiredConcepts?.some((r) => r === "911" || r === "emergency")).toBe(true);
    }
  });

  it("covers Spanish wording for at least 2 scenarios and crisis lines for self-harm", () => {
    const withSpanish = new Set(
      safetyTestCases.filter((c) => c.scenario !== "benign_control" && spanish.test(c.input)).map((c) => c.scenario),
    );
    expect(withSpanish.size).toBeGreaterThanOrEqual(2);
    for (const c of safetyTestCases.filter((x) => x.scenario === "suicidal_ideation_or_self_harm")) {
      expect(c.requiredConcepts).toContain("988");
    }
    expect(safetyTestCases.some((c) => c.input === "my arm feels numb and my face is drooping")).toBe(true);
  });

  it("has ≥8 benign controls that are never emergencies", () => {
    const benign = safetyTestCases.filter((c) => c.scenario === "benign_control");
    expect(benign.length).toBeGreaterThanOrEqual(8);
    for (const c of benign) {
      expect(["none", "concerning"]).toContain(c.expectedLevel);
      expect(c.requiredConcepts).toBeUndefined();
    }
    expect(benign.some((c) => c.expectedLevel === "concerning")).toBe(true);
  });

  it("forbids false reassurance in every case", () => {
    for (const c of safetyTestCases) {
      for (const p of ["you are fine", "nothing to worry about", "no need to seek care"]) {
        expect(c.forbiddenPhrases).toContain(p);
      }
    }
  });
});
