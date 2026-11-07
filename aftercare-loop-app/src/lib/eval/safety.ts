/**
 * Safety suite: deterministic rules (`evaluateSafety`) over the synthetic
 * `safetyTestCases`. A case passes iff
 *   - verdict.level === expectedLevel (exact), and
 *   - the guidance contains none of the case's forbiddenPhrases, and
 *   - for expected emergencies, the guidance includes every requiredConcept.
 * A separate lenient metric reports "no emergency missed": expected emergency ⇒
 * got emergency. Limited synthetic evaluation — not clinical validation.
 */
import type {
  ConfusionMatrix,
  EvalCaseResult,
  EvalMetric,
  SafetyTestCase,
  SafetyVerdict,
} from "@/lib/types";
import { countMetric, ratioMetric } from "./metrics";

export type EvaluateSafetyFn = (text: string) => SafetyVerdict;

export interface SafetySuiteResult {
  metrics: EvalMetric[];
  /** Emergency detection as a binary classifier (positive = emergency). */
  confusion: ConfusionMatrix;
  cases: EvalCaseResult[];
  errors: string[];
}

function containsPhrase(haystack: string, phrase: string): boolean {
  return haystack.toLowerCase().includes(phrase.toLowerCase());
}

export function runSafetySuite(testCases: SafetyTestCase[], evaluate: EvaluateSafetyFn): SafetySuiteResult {
  const cases: EvalCaseResult[] = [];
  const errors: string[] = [];
  const confusion: ConfusionMatrix = { truePositives: 0, falsePositives: 0, falseNegatives: 0, trueNegatives: 0 };
  let passed = 0;
  let evaluated = 0;
  let expectedEmergencies = 0;
  let emergenciesCaught = 0;
  let nonEmergencies = 0;
  let nonEmergenciesNotEscalated = 0;

  for (const tc of testCases) {
    const caseId = tc.id;
    let verdict: SafetyVerdict;
    try {
      verdict = evaluate(tc.input);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${caseId}: ${message}`);
      cases.push({ caseId, suite: "safety", passed: false, details: `Not evaluated: rules threw (${message}).`, expected: { level: tc.expectedLevel } });
      continue;
    }
    evaluated++;

    const guidance = verdict.guidance ?? "";
    const levelOk = verdict.level === tc.expectedLevel;
    const forbiddenFound = tc.forbiddenPhrases.filter((p) => containsPhrase(guidance, p));
    const isEmergencyCase = tc.expectedLevel === "emergency";
    const requiredMissing = isEmergencyCase
      ? (tc.requiredConcepts ?? []).filter((c) => !containsPhrase(guidance, c))
      : [];
    const ok = levelOk && forbiddenFound.length === 0 && requiredMissing.length === 0;
    if (ok) passed++;

    const gotEmergency = verdict.level === "emergency";
    if (isEmergencyCase) {
      expectedEmergencies++;
      if (gotEmergency) {
        emergenciesCaught++;
        confusion.truePositives++;
      } else confusion.falseNegatives++;
    } else {
      nonEmergencies++;
      if (gotEmergency) confusion.falsePositives++;
      else {
        nonEmergenciesNotEscalated++;
        confusion.trueNegatives = (confusion.trueNegatives ?? 0) + 1;
      }
    }

    const problems: string[] = [];
    if (!levelOk) problems.push(`expected level "${tc.expectedLevel}", got "${verdict.level}"`);
    if (forbiddenFound.length) problems.push(`guidance contains forbidden phrase(s): ${forbiddenFound.join(", ")}`);
    if (requiredMissing.length) problems.push(`guidance missing required concept(s): ${requiredMissing.join(", ")}`);

    cases.push({
      caseId,
      suite: "safety",
      passed: ok,
      details: ok
        ? `Level "${verdict.level}"${verdict.scenario ? ` (${verdict.scenario})` : ""} as expected.`
        : problems.join("; "),
      expected: { level: tc.expectedLevel, scenario: tc.scenario, requiredConcepts: tc.requiredConcepts ?? [] },
      actual: {
        level: verdict.level,
        scenario: verdict.scenario,
        detectedBy: verdict.detectedBy,
        matchedPhrases: verdict.matchedPhrases ?? [],
        hasGuidance: guidance.length > 0,
      },
    });
  }

  const failed = evaluated - passed;
  const metrics: EvalMetric[] = [
    countMetric("Safety cases evaluated", evaluated, testCases.length),
    countMetric("Passed", passed, evaluated),
    countMetric("Failed", failed, evaluated),
    ratioMetric("Pass rate", passed, evaluated),
    ratioMetric("No emergency missed (expected emergency ⇒ got emergency)", emergenciesCaught, expectedEmergencies),
    ratioMetric("Non-emergency inputs not escalated to emergency", nonEmergenciesNotEscalated, nonEmergencies),
  ];
  return { metrics, confusion, cases, errors };
}
