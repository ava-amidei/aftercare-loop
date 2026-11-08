import { describe, expect, it } from "vitest";
import type { TeachBackQuestion } from "@/lib/types";
import { groundTruths } from "@/data/ground-truth";
import { scoreTeachBack } from "@/lib/services/teach-back";
import {
  defaultClarifyTemplate,
  evaluateQuestion,
  pickDistractor,
  pickRetryAnswer,
  runComprehensionSuite,
  type ScoreTeachBackFn,
} from "./comprehension";

const base: TeachBackQuestion = {
  id: "tb-x",
  patientId: "pt-x",
  documentId: "doc-x",
  prompt: "When is your follow-up?",
  sourceRef: { documentId: "doc-x", start: 0, end: 20, quote: "Return in two weeks." },
  expectedAnswer: "In two weeks",
  acceptedVariations: ["two weeks", "2 weeks"],
  keyConcepts: ["two weeks"],
  choices: [
    { id: "a", text: "In two weeks", correct: true },
    { id: "b", text: "Next year", correct: false },
    { id: "c", text: "Only if I feel sick", correct: false },
  ],
  scoring: { minKeyConceptsForCorrect: 1, misconceptions: [{ pattern: "only if", clarification: "The visit is planned either way." }] },
};

/** Tiny reference scorer for unit tests (the real one is exercised below). */
const fakeScore: ScoreTeachBackFn = (q, r) => {
  const lower = r.toLowerCase();
  const correct = lower.includes("two weeks") || lower.includes("2 weeks");
  const mis = (q.scoring.misconceptions ?? []).find((m) => lower.includes(m.pattern));
  return { correct, matchedConcepts: correct ? ["two weeks"] : [], misunderstanding: correct ? undefined : mis?.clarification };
};

describe("pickDistractor", () => {
  it("prefers a wrong choice containing a misconception", () => {
    expect(pickDistractor(base)).toEqual({ text: "Only if I feel sick", source: "wrong_choice_with_misconception" });
  });
  it("falls back to a wrong choice, then a misconception phrase, then null", () => {
    expect(pickDistractor({ ...base, scoring: { minKeyConceptsForCorrect: 1 } })?.source).toBe("wrong_choice");
    expect(pickDistractor({ ...base, choices: undefined })).toEqual({ text: "only if", source: "misconception_phrase" });
    expect(pickDistractor({ ...base, choices: undefined, scoring: { minKeyConceptsForCorrect: 1 } })).toBeNull();
  });
});

describe("simulated retry after clarification (fix 19)", () => {
  it("uses the last accepted variation, falling back to the expected answer", () => {
    expect(pickRetryAnswer(base)).toEqual({ text: "2 weeks", source: "accepted_variation" });
    expect(pickRetryAnswer({ ...base, acceptedVariations: [] })).toEqual({ text: "In two weeks", source: "expected_answer" });
  });

  it("scores the retry with the variation, not q.expectedAnswer, and records the source", () => {
    const seen: string[] = [];
    const spy: ScoreTeachBackFn = (q, r) => {
      seen.push(r);
      return fakeScore(q, r);
    };
    const o = evaluateQuestion(base, "en", spy);
    expect(o.retry).toEqual({ response: "2 weeks", source: "accepted_variation" });
    // expected answer once (initial), each variation once, the distractor, then the retry variation.
    expect(seen).toEqual(["In two weeks", "two weeks", "2 weeks", "Only if I feel sick", "2 weeks"]);

    const r = runComprehensionSuite([{ question: base, language: "en" }], fakeScore);
    expect(r.cases[0]!.actual).toMatchObject({ retryResponse: "2 weeks", retrySource: "accepted_variation", finalCorrect: true });
  });

  it("a retry variation the scorer rejects is reported, not masked by the answer key", () => {
    const q = { ...base, acceptedVariations: ["two weeks", "a fortnight"] };
    const r = runComprehensionSuite([{ question: q, language: "en" }], fakeScore);
    expect(r.cases[0]!.passed).toBe(false);
    expect(r.cases[0]!.details).toContain("retry after clarification still scored incorrect");
    expect(r.metrics.find((m) => m.name === "Correct after clarification")).toMatchObject({ numerator: 0, denominator: 1 });
  });
});

describe("defaultClarifyTemplate", () => {
  it("uses the predefined misconception clarification or restates the source quote", () => {
    expect(defaultClarifyTemplate({ question: base, response: "only if sick", language: "en" })).toBe("The visit is planned either way.");
    expect(defaultClarifyTemplate({ question: base, response: "next year", language: "es" })).toContain("“Return in two weeks.”");
  });
});

describe("runComprehensionSuite", () => {
  it("aggregates initial correct, misunderstandings, and correct after clarification", () => {
    const noMisconception = { ...base, id: "tb-y", scoring: { minKeyConceptsForCorrect: 1 } };
    const r = runComprehensionSuite(
      [
        { question: base, language: "en" },
        { question: noMisconception, language: "en" },
      ],
      fakeScore,
    );
    const m = Object.fromEntries(r.metrics.map((x) => [x.name, x]));
    expect(m["Total questions"]).toMatchObject({ numerator: 2, denominator: 2 });
    expect(m["Accepted variations scored correct"]).toMatchObject({ numerator: 4, denominator: 4 });
    expect(m["Wrong answers scored incorrect"]).toMatchObject({ numerator: 2, denominator: 2 });
    expect(m["Misunderstandings identified"]).toMatchObject({ numerator: 1, denominator: 2 });
    expect(m["Correct after clarification"]).toMatchObject({ numerator: 2, denominator: 2 });
    expect(m["Unsuccessful clarifications"]).toMatchObject({ numerator: 0, denominator: 2 });
    expect(r.cases.map((c) => c.passed)).toEqual([true, false]);
  });

  it("zero questions → Not evaluated", () => {
    const r = runComprehensionSuite([], fakeScore);
    expect(r.metrics.every((m) => m.value === null)).toBe(true);
  });

  it("runs every fixture question through the real deterministic scorer", () => {
    const inputs = groundTruths.flatMap((g) => g.teachBackQuestions.map((question) => ({ question, language: "en" as const })));
    const r = runComprehensionSuite(inputs, scoreTeachBack);
    expect(r.errors).toEqual([]);
    expect(r.cases).toHaveLength(inputs.length);
    const total = r.metrics.find((x) => x.name === "Total questions")!;
    expect(total.numerator).toBe(inputs.length);
  });
});
