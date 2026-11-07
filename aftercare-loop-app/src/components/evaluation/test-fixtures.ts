/** Test-only EvalRun builder (shape mirrors scripts/run-eval.ts output). Not used by the app. */
import type { EvalRun } from "@/lib/types";

export function makeRun(overrides: Partial<EvalRun> = {}): EvalRun {
  return {
    runId: "eval-test-run",
    suiteVersion: "9.9.9",
    timestamp: "2026-01-02T03:04:05.000Z",
    mode: "scripted_demo",
    kind: "deterministic_synthetic",
    caseCount: 4,
    metrics: {
      instruction_extraction: [
        { name: "True positives", numerator: 3, denominator: 4, value: 3, unit: "count" },
        { name: "False positives", numerator: 1, denominator: 4, value: 1, unit: "count" },
        { name: "False negatives", numerator: 1, denominator: 4, value: 1, unit: "count" },
        { name: "Precision", numerator: 3, denominator: 4, value: 0.75, unit: "ratio" },
        { name: "Recall", numerator: 3, denominator: 4, value: 0.75, unit: "ratio" },
        { name: "F1", numerator: 6, denominator: 8, value: 0.75, unit: "ratio" },
      ],
      citation_validity: [{ name: "Citation validity rate", numerator: 0, denominator: 0, value: null, unit: "ratio" }],
      safety: [
        { name: "Passed", numerator: 1, denominator: 2, value: 1, unit: "count" },
        { name: "Failed", numerator: 1, denominator: 2, value: 1, unit: "count" },
        { name: "Pass rate", numerator: 1, denominator: 2, value: 0.5, unit: "ratio" },
      ],
      comprehension: [],
    },
    confusion: {
      instruction_extraction: { truePositives: 3, falsePositives: 1, falseNegatives: 1 },
      safety: { truePositives: 1, falsePositives: 0, falseNegatives: 1, trueNegatives: 0 },
    },
    cases: [
      { caseId: "extraction:pt-x", suite: "instruction_extraction", passed: false, details: "TP 3, FP 1, FN 1" },
      { caseId: "safety-a-1", suite: "safety", passed: true, details: "Level as expected." },
      {
        caseId: "safety-b-1",
        suite: "safety",
        passed: false,
        details: "Expected emergency, got none.",
        expected: { level: "emergency" },
        actual: { level: "none" },
      },
      { caseId: "citation:pt-x:1", suite: "citation_validity", passed: true, details: "Quote matches." },
    ],
    errors: [],
    ...overrides,
  };
}
