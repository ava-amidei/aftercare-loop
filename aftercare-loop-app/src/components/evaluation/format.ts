/**
 * Pure helpers for the evaluation dashboard. Everything rendered comes from the
 * EvalRun file written by `npm run eval`; nothing here invents a number.
 */
import type { EvalCaseResult, EvalMetric, EvalRun, EvalSuite, Language } from "@/lib/types";
import type { TranslationKey } from "@/lib/i18n";

export const EVAL_SUITES: readonly EvalSuite[] = [
  "instruction_extraction",
  "citation_validity",
  "safety",
  "comprehension",
] as const;

/**
 * Metric names emitted by src/lib/eval (exact strings) → translated labels.
 * Unknown names fall back to the raw name from the file, so new metrics still render.
 */
export const METRIC_NAME_KEYS: Record<string, TranslationKey> = {
  "Patients evaluated": "evaluation.metricName.patientsEvaluated",
  "True positives": "evaluation.metric.truePositives",
  "False positives": "evaluation.metric.falsePositives",
  "False negatives": "evaluation.metric.falseNegatives",
  Precision: "evaluation.metric.precision",
  Recall: "evaluation.metric.recall",
  F1: "evaluation.metric.f1",
  "Optional instructions extracted (not counted as FP)": "evaluation.metricName.optionalExtracted",
  "Verified citations checked": "evaluation.metricName.verifiedChecked",
  "Valid citations": "evaluation.metricName.validCitations",
  "Invalid citations": "evaluation.metric.invalidCitations",
  "Citation validity rate": "evaluation.metricName.citationRate",
  "Unverified instructions (routed to Needs clarification)": "evaluation.metricName.unverifiedRouted",
  "Safety cases evaluated": "evaluation.metricName.safetyEvaluated",
  Passed: "evaluation.metric.passed",
  Failed: "evaluation.metric.failed",
  "Pass rate": "evaluation.metricName.passRate",
  "No emergency missed (expected emergency ⇒ got emergency)": "evaluation.metricName.noEmergencyMissed",
  "Non-emergency inputs not escalated to emergency": "evaluation.metricName.noFalseEscalation",
  "Total questions": "evaluation.metric.totalQuestions",
  "Initial correct (expected answer and all accepted variations)": "evaluation.metricName.initialCorrect",
  "Accepted variations scored correct": "evaluation.metricName.variationsCorrect",
  "Wrong answers scored incorrect": "evaluation.metricName.wrongAnswersCaught",
  "Misunderstandings identified": "evaluation.metric.misunderstandingsIdentified",
  "Correct after clarification": "evaluation.metric.correctAfterClarification",
  "Unsuccessful clarifications": "evaluation.metric.unsuccessfulClarifications",
};

/** Preferred headline metric per suite (by exact name); falls back to the first ratio metric. */
const HEADLINE_NAMES: Record<EvalSuite, string[]> = {
  instruction_extraction: ["F1"],
  citation_validity: ["Citation validity rate"],
  safety: ["Pass rate"],
  comprehension: ["Correct after clarification"],
};

export function isEvaluated(metric: EvalMetric): boolean {
  return metric.value !== null && Number.isFinite(metric.value);
}

/** A suite is "Not evaluated" when it has no metrics or every metric value is null. */
export function suiteEvaluated(metrics: EvalMetric[] | undefined): boolean {
  return Boolean(metrics && metrics.some(isEvaluated));
}

export function findMetric(metrics: EvalMetric[] | undefined, name: string): EvalMetric | undefined {
  return metrics?.find((m) => m.name === name);
}

export function headlineMetric(suite: EvalSuite, metrics: EvalMetric[] | undefined): EvalMetric | undefined {
  if (!metrics?.length) return undefined;
  for (const name of HEADLINE_NAMES[suite]) {
    const m = findMetric(metrics, name);
    if (m) return m;
  }
  return metrics.find((m) => m.unit === "ratio");
}

/** Formatted value, or null when the metric was not evaluated (render "Not evaluated"). */
export function formatMetricValue(metric: EvalMetric, lang: Language): string | null {
  if (!isEvaluated(metric)) return null;
  const value = metric.value as number;
  if (metric.unit === "ratio") {
    return new Intl.NumberFormat(lang, { style: "percent", maximumFractionDigits: 1 }).format(value);
  }
  return new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(value);
}

/** Numerator/denominator pair when both are present and the metric was evaluated. */
export function metricFraction(metric: EvalMetric): { numerator: number; denominator: number } | null {
  if (!isEvaluated(metric)) return null;
  if (typeof metric.numerator !== "number" || typeof metric.denominator !== "number") return null;
  return { numerator: metric.numerator, denominator: metric.denominator };
}

export type CaseStatusFilter = "all" | "passed" | "failed";
export type CaseSuiteFilter = "all" | EvalSuite;

export function filterCases(
  cases: EvalCaseResult[],
  filter: { suite: CaseSuiteFilter; status: CaseStatusFilter },
): EvalCaseResult[] {
  return cases.filter(
    (c) =>
      (filter.suite === "all" || c.suite === filter.suite) &&
      (filter.status === "all" || (filter.status === "passed" ? c.passed : !c.passed)),
  );
}

export function failedCases(run: EvalRun, suite: EvalSuite): EvalCaseResult[] {
  return run.cases.filter((c) => c.suite === suite && !c.passed);
}

export function countCases(cases: EvalCaseResult[]): { total: number; passed: number; failed: number } {
  const passed = cases.filter((c) => c.passed).length;
  return { total: cases.length, passed, failed: cases.length - passed };
}

/** Compact, readable rendering of the `expected` / `actual` payloads stored per case. */
export function formatPayload(value: unknown): string {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function formatTimestamp(iso: string, lang: Language): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/**
 * Where each extraction case's instructions came from, read from the stored
 * case payload (`actual.source`) — "skipped" = the case did not run.
 */
export function extractionSourceCounts(run: EvalRun): { live: number; fallback: number; skipped: number; other: number } {
  const counts = { live: 0, fallback: 0, skipped: 0, other: 0 };
  for (const c of run.cases) {
    if (c.suite !== "instruction_extraction") continue;
    const source =
      c.actual && typeof c.actual === "object" && "source" in c.actual ? (c.actual as { source?: unknown }).source : undefined;
    if (source === "live") counts.live++;
    else if (source === "heuristic") counts.fallback++;
    else if (c.details.startsWith("Not evaluated")) counts.skipped++;
    else counts.other++;
  }
  return counts;
}
