import { describe, expect, it } from "vitest";
import { groundTruths } from "@/data/ground-truth";
import type { TeachBackQuestion } from "@/lib/types";
import {
  buildConceptGroups,
  normalizeAnswer,
  scoreTeachBack,
  variationOverlap,
  tokenize,
} from "./teach-back-scoring";

const allQuestions: TeachBackQuestion[] = groundTruths.flatMap((g) => g.teachBackQuestions);

describe("fixture coverage", () => {
  it("has teach-back questions for all 12 patients", () => {
    expect(groundTruths).toHaveLength(12);
    for (const g of groundTruths) expect(g.teachBackQuestions.length).toBeGreaterThan(0);
  });
});

describe("normalizeAnswer", () => {
  it("lowercases, strips accents and punctuation, maps number words", () => {
    expect(normalizeAnswer("  Cada AÑO, ¡con mi médico!  ")).toBe("cada ano con mi medico");
    expect(normalizeAnswer("Don't eat for eight hours.")).toBe("dont eat for 8 hours");
    expect(normalizeAnswer("ocho horas")).toBe("8 horas");
  });
});

describe.each(allQuestions.map((q) => [q.id, q] as const))("question %s", (_id, q) => {
  it("scores the expected answer and every accepted variation as correct", () => {
    for (const v of [q.expectedAnswer, ...q.acceptedVariations]) {
      const s = scoreTeachBack(q, v);
      expect(s.correct, `variation: ${v}`).toBe(true);
      expect(s.misunderstanding).toBeUndefined();
    }
  });

  it("scores a clearly wrong answer as incorrect", () => {
    expect(scoreTeachBack(q, "I'm not sure, I don't remember").correct).toBe(false);
    expect(scoreTeachBack(q, "No estoy segura, no me acuerdo").correct).toBe(false);
    expect(scoreTeachBack(q, "").correct).toBe(false);
  });

  it("scores wrong multiple-choice texts as incorrect even as free text", () => {
    for (const c of q.choices ?? []) {
      // Extra words force the free-text path rather than an exact choice match.
      const s = scoreTeachBack(q, `${c.text} I think`);
      expect(s.correct, `choice ${c.id}: ${c.text}`).toBe(c.correct);
    }
  });

  it("matches choices by id", () => {
    for (const c of q.choices ?? []) {
      const s = scoreTeachBack(q, c.id.toUpperCase());
      expect(s.matchedBy).toBe("choice");
      expect(s.choiceId).toBe(c.id);
      expect(s.correct).toBe(c.correct);
    }
  });

  it("detects each predefined misconception", () => {
    for (const m of q.scoring.misconceptions ?? []) {
      const s = scoreTeachBack(q, `Maybe ${m.pattern}?`);
      expect(s.correct).toBe(false);
      expect(s.misunderstanding).toBe(m.clarification);
    }
  });
});

describe("concept matching", () => {
  const base: TeachBackQuestion = {
    id: "tb-test",
    patientId: "pt-test",
    documentId: "doc-test",
    prompt: "When is the follow-up?",
    sourceRef: { documentId: "doc-test", start: 0, end: 10, quote: "Follow up." },
    expectedAnswer: "In two weeks at the clinic",
    acceptedVariations: [],
    keyConcepts: ["2 weeks|fortnight", "clinic|office"],
    scoring: {
      minKeyConceptsForCorrect: 2,
      misconceptions: [{ pattern: "next year", clarification: "The summary says in 2 weeks." }],
    },
  };

  it("supports concept|synonym syntax", () => {
    const s = scoreTeachBack(base, "a fortnight from now at the office");
    expect(s.correct).toBe(true);
    expect(s.matchedConcepts).toEqual(["2 weeks", "clinic"]);
  });

  it("supports the conceptSynonyms field", () => {
    const q = { ...base, keyConcepts: ["2 weeks", "clinic"], conceptSynonyms: { clinic: ["health center"] } };
    expect(scoreTeachBack(q, "in 2 weeks at the health center").correct).toBe(true);
  });

  it("does not double count merged synonyms", () => {
    const q = { ...base, keyConcepts: ["8 hours", "eight hours", "water"] };
    expect(buildConceptGroups(q)).toHaveLength(2);
    expect(scoreTeachBack(q, "eight hours").correct).toBe(false);
    expect(scoreTeachBack(q, "eight hours, only water").correct).toBe(true);
  });

  it("tolerates plural suffixes", () => {
    expect(scoreTeachBack(base, "two weeks, clinics").correct).toBe(true);
  });

  it("reports the misconception when not correct", () => {
    const s = scoreTeachBack(base, "next year");
    expect(s.correct).toBe(false);
    expect(s.misunderstanding).toBe("The summary says in 2 weeks.");
  });

  it("fuzzy variation overlap ≥ 0.6", () => {
    const q = { ...base, keyConcepts: [], acceptedVariations: ["return visit two weeks clinic"] };
    expect(variationOverlap(tokenize("clinic return in 2 weeks"), tokenize("return visit two weeks clinic"))).toBeGreaterThanOrEqual(0.6);
    expect(scoreTeachBack(q, "clinic return in 2 weeks").correct).toBe(true);
    expect(scoreTeachBack(q, "the clinic").correct).toBe(false);
  });

  it("is deterministic", () => {
    const r = "two weeks at the clinic";
    expect(scoreTeachBack(base, r)).toEqual(scoreTeachBack(base, r));
  });
});

// ---------------------------------------------------------------------------
// Judge-panel fix 5 (docs/VALIDATION-REPORT.md §4): misconceptions veto
// free-text correctness; optional required concepts.
// ---------------------------------------------------------------------------

describe("misconception veto and required concepts (fix 5)", () => {
  const q = (id: string): TeachBackQuestion => {
    const found = allQuestions.find((x) => x.id === id);
    if (!found) throw new Error(`missing ${id}`);
    return found;
  };
  const withRequired = (question: TeachBackQuestion, requiredConcepts: string[]): TeachBackQuestion => ({
    ...question,
    scoring: { ...question.scoring, requiredConcepts } as TeachBackQuestion["scoring"],
  });

  it("tb-pt-e-3: 'take an extra water pill and call the clinic' is incorrect with the misunderstanding", () => {
    const r = scoreTeachBack(q("tb-pt-e-3"), "take an extra water pill and call the clinic");
    expect(r.correct).toBe(false);
    expect(r.matchedBy).toBe("none");
    expect(r.misunderstanding).toMatch(/Do not change your medicine/);
  });

  it("tb-pt-b-3: 'wait and call the clinic tomorrow' is incorrect with the misunderstanding", () => {
    const r = scoreTeachBack(q("tb-pt-b-3"), "wait and call the clinic tomorrow");
    expect(r.correct).toBe(false);
    expect(r.misunderstanding).toMatch(/same-day call/);
  });

  it("tb-pt-e-3: 'wait and call the clinic next week' is incorrect", () => {
    expect(scoreTeachBack(q("tb-pt-e-3"), "wait and call the clinic next week").correct).toBe(false);
  });

  it("a choice or an exact accepted variation is not vetoed", () => {
    expect(scoreTeachBack(q("tb-pt-b-3"), "a").correct).toBe(true);
    expect(scoreTeachBack(q("tb-pt-e-3"), "Call the clinic if I gain 2 pounds in a day").correct).toBe(true);
    expect(scoreTeachBack(q("tb-pt-b-3"), "Call the clinic the same day.").correct).toBe(true);
  });

  it("a negated misconception phrase does not veto ('don't wait')", () => {
    const r = scoreTeachBack(q("tb-pt-b-3"), "Don't wait, call the clinic the same day");
    expect(r.correct).toBe(true);
    const e = scoreTeachBack(q("tb-pt-e-3"), "I would not take an extra water pill, I'd call the clinic about 2 pounds");
    expect(e.correct).toBe(true);
    // A new subject ends the negation: "won't call, I'd wait" still says wait.
    expect(scoreTeachBack(q("tb-pt-b-3"), "I won't call the clinic, I'd wait").correct).toBe(false);
  });

  it("every fixture's expected answer and accepted variations still score correct", () => {
    for (const question of allQuestions) {
      for (const v of [question.expectedAnswer, ...question.acceptedVariations]) {
        expect({ id: question.id, v, correct: scoreTeachBack(question, v).correct }).toEqual({ id: question.id, v, correct: true });
      }
    }
  });

  it("required concept 'same day|today' (tb-pt-b-3): generic concepts alone are not enough", () => {
    const req = withRequired(q("tb-pt-b-3"), ["same day|today"]);
    expect(scoreTeachBack(req, "call the clinic").correct).toBe(false);
    expect(scoreTeachBack(req, "call the clinic tomorrow").correct).toBe(false);
    expect(scoreTeachBack(req, "I'd phone the clinic today").correct).toBe(true);
    expect(scoreTeachBack(req, "call the clinic on the same day").correct).toBe(true);
    // Unchanged when the field is absent.
    expect(scoreTeachBack(q("tb-pt-b-3"), "call the clinic").correct).toBe(true);
  });

  it("required concept '2 pounds|5 pounds' (tb-pt-e-3)", () => {
    const req = withRequired(q("tb-pt-e-3"), ["2 pounds|5 pounds"]);
    expect(scoreTeachBack(req, "call the clinic").correct).toBe(false);
    expect(scoreTeachBack(req, "call the clinic if I gain two pounds in a day").correct).toBe(true);
    expect(scoreTeachBack(req, "phone the clinic if I'm up five pounds in a week").correct).toBe(true);
    // Required concepts never bypass the misconception veto.
    expect(scoreTeachBack(req, "take an extra water pill and call the clinic about 2 pounds").correct).toBe(false);
  });
});
