/**
 * Instruction-extraction suite: extracted instructions vs. ground truth.
 *
 * Matching (one-to-one, greedy by score):
 *   1. span overlap — the extracted quote, located in the document, overlaps the
 *      expected quote's span; or
 *   2. description similarity — token Jaccard ≥ 0.5 against the expected
 *      description or any of its acceptedDescriptions.
 * Unmatched extracted instructions are false positives, EXCEPT those that match
 * a ground-truth `optionalInstructionQuotes` entry (real document sentences that
 * are neither required nor fabricated); those are reported separately.
 */
import type {
  ConfusionMatrix,
  EvalCaseResult,
  EvalMetric,
  ExtractedInstruction,
  GroundTruthInstruction,
  PatientGroundTruth,
  PatientProfile,
  VisitDocument,
} from "@/lib/types";
import { EMPTY_CONFUSION, addConfusion, countMetric, precisionRecallF1, tokenJaccard } from "./metrics";

export const DESCRIPTION_JACCARD_THRESHOLD = 0.5;

/** Optional provenance an extractor may report alongside its instructions. */
export interface ExtractionOutput {
  instructions: ExtractedInstruction[];
  /** e.g. "live" | "scripted" | "heuristic". */
  source?: string;
  /** Model id actually used, when source is "live". */
  model?: string;
  /** Safe error string (e.g. live call failed and a fallback was used). */
  error?: string;
}

/** Contract: `extractInstructions({ profile, document }) → ExtractedInstruction[]` (provenance optional). */
export type ExtractFn = (input: {
  profile: PatientProfile;
  document: VisitDocument;
}) => Promise<ExtractedInstruction[] | ExtractionOutput>;

export interface ExtractionCase {
  profile: PatientProfile;
  document: VisitDocument;
  groundTruth: PatientGroundTruth;
}

export interface Span {
  start: number;
  end: number;
}

export type MatchBasis = "span_overlap" | "description_similarity";

export interface InstructionMatch {
  expectedIndex: number;
  extractedIndex: number;
  basis: MatchBasis;
  score: number;
}

export interface PatientExtractionResult {
  patientId: string;
  documentId: string;
  /** null when extraction threw — the case is excluded from metrics. */
  extracted: ExtractedInstruction[] | null;
  source?: string;
  model?: string;
  matches: InstructionMatch[];
  falsePositiveIndexes: number[];
  optionalIndexes: number[];
  falseNegativeIndexes: number[];
  confusion: ConfusionMatrix;
  error?: string;
}

export interface ExtractionSuiteResult {
  metrics: EvalMetric[];
  confusion: ConfusionMatrix;
  cases: EvalCaseResult[];
  errors: string[];
  perPatient: PatientExtractionResult[];
}

// ---------------------------------------------------------------------------
// Span helpers
// ---------------------------------------------------------------------------

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Exact location first, then a case-insensitive, whitespace-tolerant search. */
export function locateSpan(text: string, quote: string | undefined): Span | null {
  if (!quote || !quote.trim()) return null;
  const exact = text.indexOf(quote);
  if (exact !== -1) return { start: exact, end: exact + quote.length };
  const parts = quote.trim().split(/\s+/).map(escapeRegExp);
  const m = new RegExp(parts.join("\\s+"), "i").exec(text);
  return m ? { start: m.index, end: m.index + m[0].length } : null;
}

/** Where an extracted instruction points in the document (offsets trusted only if they match). */
export function extractedSpan(doc: VisitDocument, item: ExtractedInstruction): Span | null {
  const ref = item.sourceRef;
  if (!ref) return null;
  if (
    ref.documentId === doc.id &&
    Number.isInteger(ref.start) &&
    Number.isInteger(ref.end) &&
    ref.start >= 0 &&
    ref.end > ref.start &&
    doc.text.slice(ref.start, ref.end) === ref.quote
  ) {
    return { start: ref.start, end: ref.end };
  }
  return locateSpan(doc.text, ref.quote);
}

/** Intersection-over-union of two spans; 0 when they don't overlap. */
export function spanIoU(a: Span, b: Span): number {
  const inter = Math.min(a.end, b.end) - Math.max(a.start, b.start);
  if (inter <= 0) return 0;
  const union = Math.max(a.end, b.end) - Math.min(a.start, b.start);
  return inter / union;
}

function bestDescriptionSimilarity(description: string, expected: GroundTruthInstruction): number {
  const candidates = [expected.description, ...expected.acceptedDescriptions];
  return Math.max(0, ...candidates.map((c) => tokenJaccard(description, c)));
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

/** Score one pair; null when neither criterion holds. Span matches rank above text-only matches. */
export function scorePair(
  expected: GroundTruthInstruction,
  expectedSpan: Span | null,
  item: ExtractedInstruction,
  itemSpan: Span | null,
): { basis: MatchBasis; score: number } | null {
  if (expectedSpan && itemSpan) {
    const iou = spanIoU(expectedSpan, itemSpan);
    if (iou > 0) return { basis: "span_overlap", score: 1 + iou };
  }
  const sim = bestDescriptionSimilarity(item.description, expected);
  if (sim >= DESCRIPTION_JACCARD_THRESHOLD) return { basis: "description_similarity", score: sim };
  return null;
}

export function matchInstructions(
  doc: VisitDocument,
  expected: GroundTruthInstruction[],
  extracted: ExtractedInstruction[],
  optionalQuotes: string[] = [],
): Omit<PatientExtractionResult, "patientId" | "documentId" | "extracted" | "error"> {
  const expectedSpans = expected.map((e) => locateSpan(doc.text, e.quote));
  const extractedSpans = extracted.map((x) => extractedSpan(doc, x));

  const pairs: InstructionMatch[] = [];
  expected.forEach((e, ei) => {
    extracted.forEach((x, xi) => {
      const s = scorePair(e, expectedSpans[ei] ?? null, x, extractedSpans[xi] ?? null);
      if (s) pairs.push({ expectedIndex: ei, extractedIndex: xi, ...s });
    });
  });
  // Deterministic greedy assignment: score desc, then index order.
  pairs.sort((a, b) => b.score - a.score || a.expectedIndex - b.expectedIndex || a.extractedIndex - b.extractedIndex);

  const usedExpected = new Set<number>();
  const usedExtracted = new Set<number>();
  const matches: InstructionMatch[] = [];
  for (const p of pairs) {
    if (usedExpected.has(p.expectedIndex) || usedExtracted.has(p.extractedIndex)) continue;
    usedExpected.add(p.expectedIndex);
    usedExtracted.add(p.extractedIndex);
    matches.push(p);
  }
  matches.sort((a, b) => a.expectedIndex - b.expectedIndex);

  const optionalSpans = optionalQuotes.map((q) => locateSpan(doc.text, q)).filter((s): s is Span => s !== null);
  const falsePositiveIndexes: number[] = [];
  const optionalIndexes: number[] = [];
  extracted.forEach((x, xi) => {
    if (usedExtracted.has(xi)) return;
    const span = extractedSpans[xi];
    const isOptional =
      (span !== null && span !== undefined && optionalSpans.some((o) => spanIoU(o, span) > 0)) ||
      optionalQuotes.some((q) => tokenJaccard(x.description, q) >= DESCRIPTION_JACCARD_THRESHOLD);
    (isOptional ? optionalIndexes : falsePositiveIndexes).push(xi);
  });
  const falseNegativeIndexes = expected.map((_, i) => i).filter((i) => !usedExpected.has(i));

  return {
    matches,
    falsePositiveIndexes,
    optionalIndexes,
    falseNegativeIndexes,
    confusion: {
      truePositives: matches.length,
      falsePositives: falsePositiveIndexes.length,
      falseNegatives: falseNegativeIndexes.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

function errorMessage(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

export async function runExtractionSuite(
  cases: ExtractionCase[],
  extract: ExtractFn,
): Promise<ExtractionSuiteResult> {
  const perPatient: PatientExtractionResult[] = [];
  const evalCases: EvalCaseResult[] = [];
  const errors: string[] = [];
  let confusion: ConfusionMatrix = { ...EMPTY_CONFUSION };
  let expectedTotal = 0;
  let extractedTotal = 0;
  let optionalTotal = 0;

  for (const c of cases) {
    const { profile, document: doc, groundTruth: gt } = c;
    const caseId = `extraction:${gt.patientId}`;
    const expectedDescriptions = gt.expectedInstructions.map((e) => e.description);

    let extracted: ExtractedInstruction[];
    let provenance: Omit<ExtractionOutput, "instructions"> = {};
    try {
      const out = await extract({ profile, document: doc });
      const list = Array.isArray(out) ? out : out?.instructions;
      if (!Array.isArray(list)) throw new TypeError("extractor did not return an instruction array");
      extracted = list;
      if (!Array.isArray(out)) provenance = { source: out.source, model: out.model, error: out.error };
    } catch (err) {
      const message = errorMessage(err);
      errors.push(`${caseId}: ${message}`);
      perPatient.push({
        patientId: gt.patientId,
        documentId: doc.id,
        extracted: null,
        matches: [],
        falsePositiveIndexes: [],
        optionalIndexes: [],
        falseNegativeIndexes: [],
        confusion: { ...EMPTY_CONFUSION },
        error: message,
      });
      evalCases.push({
        caseId,
        suite: "instruction_extraction",
        passed: false,
        details: `Not evaluated: extraction failed (${message}). Excluded from precision/recall.`,
        expected: expectedDescriptions,
      });
      continue;
    }

    if (provenance.error) errors.push(`${caseId}: ${provenance.error} (source used: ${provenance.source ?? "unknown"})`);
    const r = matchInstructions(doc, gt.expectedInstructions, extracted, gt.optionalInstructionQuotes ?? []);
    perPatient.push({
      patientId: gt.patientId,
      documentId: doc.id,
      extracted,
      ...(provenance.source ? { source: provenance.source } : {}),
      ...(provenance.model ? { model: provenance.model } : {}),
      ...r,
    });
    confusion = addConfusion(confusion, r.confusion);
    expectedTotal += gt.expectedInstructions.length;
    extractedTotal += extracted.length;
    optionalTotal += r.optionalIndexes.length;

    const { truePositives: tp, falsePositives: fp, falseNegatives: fn } = r.confusion;
    evalCases.push({
      caseId,
      suite: "instruction_extraction",
      passed: fp === 0 && fn === 0,
      details:
        `TP ${tp}, FP ${fp}, FN ${fn} (expected ${gt.expectedInstructions.length}, extracted ${extracted.length}` +
        (r.optionalIndexes.length ? `, ${r.optionalIndexes.length} optional excluded` : "") +
        ")" +
        (provenance.source ? ` via ${provenance.source}` : ""),
      expected: expectedDescriptions,
      actual: {
        matches: r.matches.map((m) => ({
          expected: gt.expectedInstructions[m.expectedIndex]!.description,
          extracted: extracted[m.extractedIndex]!.description,
          basis: m.basis,
          score: Math.round(m.score * 1000) / 1000,
        })),
        falsePositives: r.falsePositiveIndexes.map((i) => extracted[i]!.description),
        optional: r.optionalIndexes.map((i) => extracted[i]!.description),
        falseNegatives: r.falseNegativeIndexes.map((i) => gt.expectedInstructions[i]!.description),
      },
    });
  }

  const evaluated = perPatient.filter((p) => p.extracted !== null).length;
  const prf = precisionRecallF1(confusion);
  const metrics: EvalMetric[] = [
    countMetric("Patients evaluated", evaluated, cases.length),
    countMetric("True positives", confusion.truePositives, expectedTotal, evaluated > 0),
    countMetric("False positives", confusion.falsePositives, extractedTotal, evaluated > 0),
    countMetric("False negatives", confusion.falseNegatives, expectedTotal, evaluated > 0),
    prf.precision,
    prf.recall,
    prf.f1,
    countMetric("Optional instructions extracted (not counted as FP)", optionalTotal, extractedTotal, evaluated > 0),
  ];

  return { metrics, confusion, cases: evalCases, errors, perPatient };
}
