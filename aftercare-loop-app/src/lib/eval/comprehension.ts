/**
 * Comprehension (teach-back) suite. For each TeachBackQuestion, deterministically:
 *   1. score every acceptedVariation            → expect correct;
 *   2. score one distractor (a wrong choice text, or a misconception phrase)
 *                                                → expect incorrect + misunderstanding identified;
 *   3. clarify via the deterministic template path (never a live model call);
 *   4. simulated retry with the LAST accepted variation (the patient's own
 *      re-phrasing rather than the canonical key; falls back to expectedAnswer
 *      only when the record has no variations) → finalCorrect. The case records
 *      which source the retry used.
 * The answer key comes ONLY from the question record (ARCHITECTURE §5). These
 * are simulated answers, not real patient responses.
 */
import type { EvalCaseResult, EvalMetric, Language, TeachBackQuestion, TeachBackScore as FullTeachBackScore } from "@/lib/types";
import { countMetric, normalizeText, ratioMetric } from "./metrics";

/** The subset of the teach-back service's score the harness relies on. */
export type TeachBackScore = Pick<FullTeachBackScore, "correct" | "matchedConcepts" | "misunderstanding">;

export type ScoreTeachBackFn = (question: TeachBackQuestion, response: string) => TeachBackScore;

/** Deterministic clarification text (no network). */
export type ClarifyTemplateFn = (input: {
  question: TeachBackQuestion;
  response: string;
  misunderstanding?: string;
  language: Language;
}) => string;

export interface ComprehensionCase {
  question: TeachBackQuestion;
  language: Language;
}

export interface ComprehensionSuiteResult {
  metrics: EvalMetric[];
  cases: EvalCaseResult[];
  errors: string[];
}

/** Where the simulated post-clarification retry answer came from. */
export type RetrySource = "accepted_variation" | "expected_answer";

/** The retry answer: the last accepted variation, else the expected answer. */
export function pickRetryAnswer(q: TeachBackQuestion): { text: string; source: RetrySource } {
  const variations = q.acceptedVariations.filter((v) => v.trim().length > 0);
  const last = variations[variations.length - 1];
  return last !== undefined ? { text: last, source: "accepted_variation" } : { text: q.expectedAnswer, source: "expected_answer" };
}

export type DistractorSource = "wrong_choice_with_misconception" | "wrong_choice" | "misconception_phrase";

/**
 * Pick one wrong answer from the question record. Prefers a wrong choice that
 * contains a known misconception (so a misunderstanding can be identified),
 * then any wrong choice, then a misconception phrase. null → none available.
 */
export function pickDistractor(q: TeachBackQuestion): { text: string; source: DistractorSource } | null {
  const wrong = (q.choices ?? []).filter((c) => !c.correct);
  const misconceptions = q.scoring.misconceptions ?? [];
  for (const choice of wrong) {
    const norm = normalizeText(choice.text);
    if (misconceptions.some((m) => norm.includes(normalizeText(m.pattern)))) {
      return { text: choice.text, source: "wrong_choice_with_misconception" };
    }
  }
  if (wrong[0]) return { text: wrong[0].text, source: "wrong_choice" };
  if (misconceptions[0]) return { text: misconceptions[0].pattern, source: "misconception_phrase" };
  return null;
}

const TEMPLATE_INTRO: Record<Language, string> = {
  en: "Let me explain that another way. Your visit summary says:",
  es: "Permítame explicarlo de otra manera. Su resumen de la visita dice:",
};

/**
 * Default template: the matching misconception's predefined clarification when
 * there is one, otherwise a re-statement of the exact source passage.
 */
export const defaultClarifyTemplate: ClarifyTemplateFn = ({ question, response, language }) => {
  const norm = normalizeText(response);
  const hit = (question.scoring.misconceptions ?? []).find((m) => norm.includes(normalizeText(m.pattern)));
  if (hit) return hit.clarification;
  return `${TEMPLATE_INTRO[language]} “${question.sourceRef.quote}”`;
};

interface QuestionOutcome {
  expectedScore: TeachBackScore;
  variationResults: (TeachBackScore & { response: string })[];
  distractor: (TeachBackScore & { response: string; source: DistractorSource }) | null;
  clarification: string | null;
  /** The simulated retry answer and its source; null when no retry ran. */
  retry: { response: string; source: RetrySource } | null;
  finalCorrect: boolean | null;
}

/** All scoring for one question; throws propagate so the caller can record an error. */
export function evaluateQuestion(
  q: TeachBackQuestion,
  language: Language,
  score: ScoreTeachBackFn,
  clarifyTemplate: ClarifyTemplateFn = defaultClarifyTemplate,
): QuestionOutcome {
  const expectedScore = score(q, q.expectedAnswer);
  const variationResults = q.acceptedVariations.map((v) => ({ response: v, ...score(q, v) }));
  const picked = pickDistractor(q);
  if (!picked) return { expectedScore, variationResults, distractor: null, clarification: null, retry: null, finalCorrect: null };

  const distractor = { response: picked.text, source: picked.source, ...score(q, picked.text) };
  if (distractor.correct) return { expectedScore, variationResults, distractor, clarification: null, retry: null, finalCorrect: null };

  const clarification = clarifyTemplate({
    question: q,
    response: picked.text,
    misunderstanding: distractor.misunderstanding,
    language,
  });
  // Simulated retry after the re-explanation: the last accepted variation (not the canonical key).
  const retry = pickRetryAnswer(q);
  const finalCorrect = score(q, retry.text).correct;
  return { expectedScore, variationResults, distractor, clarification, retry: { response: retry.text, source: retry.source }, finalCorrect };
}

export function runComprehensionSuite(
  inputs: ComprehensionCase[],
  score: ScoreTeachBackFn,
  clarifyTemplate: ClarifyTemplateFn = defaultClarifyTemplate,
): ComprehensionSuiteResult {
  const cases: EvalCaseResult[] = [];
  const errors: string[] = [];

  let questionsEvaluated = 0;
  let variationsTotal = 0;
  let variationsCorrect = 0;
  /** Questions whose expected answer and every accepted variation scored correct on the first attempt. */
  let initialCorrect = 0;
  let distractorsTotal = 0;
  let distractorsRejected = 0;
  let misunderstandingsIdentified = 0;
  let clarificationsAttempted = 0;
  let correctAfterClarification = 0;

  for (const { question: q, language } of inputs) {
    const caseId = `comprehension:${q.id}`;
    let o: QuestionOutcome;
    try {
      o = evaluateQuestion(q, language, score, clarifyTemplate);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${caseId}: ${message}`);
      cases.push({ caseId, suite: "comprehension", passed: false, details: `Not evaluated: scoring threw (${message}).` });
      continue;
    }

    questionsEvaluated++;
    const vCorrect = o.variationResults.filter((r) => r.correct).length;
    variationsTotal += o.variationResults.length;
    variationsCorrect += vCorrect;
    if (o.expectedScore.correct && vCorrect === o.variationResults.length) initialCorrect++;
    if (o.distractor) {
      distractorsTotal++;
      if (!o.distractor.correct) distractorsRejected++;
      if (!o.distractor.correct && o.distractor.misunderstanding) misunderstandingsIdentified++;
    }
    if (o.clarification !== null) {
      clarificationsAttempted++;
      if (o.finalCorrect) correctAfterClarification++;
    }

    const problems: string[] = [];
    if (!o.expectedScore.correct) problems.push("expected answer scored incorrect");
    const missed = o.variationResults.filter((r) => !r.correct).map((r) => `"${r.response}"`);
    if (missed.length) problems.push(`accepted variation(s) scored incorrect: ${missed.join(", ")}`);
    if (!o.distractor) problems.push("no wrong answer available in the question record");
    else if (o.distractor.correct) problems.push(`wrong answer "${o.distractor.response}" scored correct`);
    else if (!o.distractor.misunderstanding) problems.push("wrong answer rejected but no misunderstanding identified");
    if (o.finalCorrect === false) problems.push("retry after clarification still scored incorrect");

    cases.push({
      caseId,
      suite: "comprehension",
      passed: problems.length === 0,
      details:
        problems.length === 0
          ? `Accepted answers scored correct; wrong answer caught, clarified, and the simulated retry (${o.retry?.source === "expected_answer" ? "expected answer" : "last accepted variation"}) scored correct.`
          : problems.join("; "),
      expected: { expectedAnswer: q.expectedAnswer, acceptedVariations: q.acceptedVariations.length },
      actual: {
        expectedAnswerCorrect: o.expectedScore.correct,
        variationsCorrect: vCorrect,
        variationsTotal: o.variationResults.length,
        distractor: o.distractor
          ? {
              response: o.distractor.response,
              source: o.distractor.source,
              correct: o.distractor.correct,
              misunderstanding: o.distractor.misunderstanding ?? null,
            }
          : null,
        clarification: o.clarification,
        clarificationMode: o.clarification === null ? null : "deterministic_template",
        retryResponse: o.retry?.response ?? null,
        retrySource: o.retry?.source ?? null,
        finalCorrect: o.finalCorrect,
      },
    });
  }

  const unsuccessful = clarificationsAttempted - correctAfterClarification;
  const metrics: EvalMetric[] = [
    countMetric("Total questions", questionsEvaluated, inputs.length),
    ratioMetric("Initial correct (expected answer and all accepted variations)", initialCorrect, questionsEvaluated),
    ratioMetric("Accepted variations scored correct", variationsCorrect, variationsTotal),
    ratioMetric("Wrong answers scored incorrect", distractorsRejected, distractorsTotal),
    ratioMetric("Misunderstandings identified", misunderstandingsIdentified, distractorsTotal),
    ratioMetric("Correct after clarification", correctAfterClarification, clarificationsAttempted),
    countMetric("Unsuccessful clarifications", unsuccessful, clarificationsAttempted),
  ];
  return { metrics, cases, errors };
}
