/**
 * Metric helpers for the evaluation harness (SPEC §12.8, ARCHITECTURE §8).
 *
 * Rule: a metric with zero cases is "Not evaluated" → value null. Numbers are
 * only ever computed from executed cases; nothing here is hardcoded.
 */
import type { ConfusionMatrix, EvalMetric } from "@/lib/types";

/** Ratio metric. denominator 0 → "Not evaluated" (value null), counts kept as-is. */
export function ratioMetric(name: string, numerator: number, denominator: number): EvalMetric {
  if (!(denominator > 0)) return { name, numerator, denominator: 0, value: null, unit: "ratio" };
  return { name, numerator, denominator, value: round(numerator / denominator), unit: "ratio" };
}

/**
 * Count metric: `count` out of the pool it was drawn from (`denominator`).
 * `evaluated` false (default: empty pool) → "Not evaluated" (value null), never a fake zero.
 */
export function countMetric(
  name: string,
  count: number,
  denominator: number,
  evaluated: boolean = denominator > 0,
): EvalMetric {
  if (!evaluated) return { name, numerator: null, denominator: null, value: null, unit: "count" };
  return { name, numerator: count, denominator, value: count, unit: "count" };
}

/** Round to 4 decimals so JSON output is stable and readable. */
export function round(value: number, digits = 4): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

export interface PrfMetrics {
  precision: EvalMetric;
  recall: EvalMetric;
  f1: EvalMetric;
}

/** Precision = TP/(TP+FP), recall = TP/(TP+FN), F1 = 2TP/(2TP+FP+FN) (exact form). */
export function precisionRecallF1(c: ConfusionMatrix): PrfMetrics {
  const tp = c.truePositives;
  return {
    precision: ratioMetric("Precision", tp, tp + c.falsePositives),
    recall: ratioMetric("Recall", tp, tp + c.falseNegatives),
    f1: ratioMetric("F1", 2 * tp, 2 * tp + c.falsePositives + c.falseNegatives),
  };
}

export function addConfusion(a: ConfusionMatrix, b: ConfusionMatrix): ConfusionMatrix {
  const out: ConfusionMatrix = {
    truePositives: a.truePositives + b.truePositives,
    falsePositives: a.falsePositives + b.falsePositives,
    falseNegatives: a.falseNegatives + b.falseNegatives,
  };
  if (a.trueNegatives !== undefined || b.trueNegatives !== undefined) {
    out.trueNegatives = (a.trueNegatives ?? 0) + (b.trueNegatives ?? 0);
  }
  return out;
}

export const EMPTY_CONFUSION: ConfusionMatrix = { truePositives: 0, falsePositives: 0, falseNegatives: 0 };

// ---------------------------------------------------------------------------
// Text matching helpers
// ---------------------------------------------------------------------------

/** Lowercase, strip accents and punctuation, collapse whitespace. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value: string): string[] {
  const norm = normalizeText(value);
  return norm ? norm.split(" ") : [];
}

/** Token-set Jaccard similarity in [0, 1]. Two empty strings → 0. */
export function tokenJaccard(a: string, b: string): number {
  const sa = new Set(tokenize(a));
  const sb = new Set(tokenize(b));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  return inter / (sa.size + sb.size - inter);
}
