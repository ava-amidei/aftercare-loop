/**
 * Reproducible evaluation harness (SPEC §12.8, ARCHITECTURE §8).
 *
 * `runEvaluation(deps, data)` is pure orchestration: every service is injected,
 * so tests can run it against fixtures without the network. `./defaults`
 * wires the real services; `scripts/run-eval.ts` writes the result to disk.
 *
 * Honesty rules: metrics come only from executed cases; zero cases → value null
 * ("Not evaluated"); scripted runs have no modelId and kind
 * "deterministic_synthetic"; live extraction makes the run "model_based".
 */
import type {
  EvalCaseResult,
  EvalRun,
  PatientGroundTruth,
  PatientProfile,
  ResponseMode,
  SafetyTestCase,
  VisitDocument,
} from "@/lib/types";
import { runCitationSuite, type CitationInput } from "./citations";
import { runComprehensionSuite, type ClarifyTemplateFn, type ComprehensionCase, type ScoreTeachBackFn } from "./comprehension";
import { runExtractionSuite, type ExtractFn, type ExtractionCase } from "./extraction";
import { runSafetySuite, type EvaluateSafetyFn } from "./safety";

export const EVAL_SUITE_VERSION = "1.0.0";

export interface EvalDeps {
  extractInstructions: ExtractFn;
  evaluateSafety: EvaluateSafetyFn;
  scoreTeachBack: ScoreTeachBackFn;
  /** Deterministic clarification (default: misconception text or source re-statement). */
  clarifyTemplate?: ClarifyTemplateFn;
  getAiMode: () => ResponseMode;
  getModelId: () => string;
  now?: () => Date;
}

export interface EvalData {
  patients: PatientProfile[];
  documents: VisitDocument[];
  groundTruths: PatientGroundTruth[];
  safetyTestCases: SafetyTestCase[];
}

/** Filename-safe, timestamp-based run id, e.g. "eval-2026-11-07T15-30-00-000Z". */
export function makeRunId(timestamp: string): string {
  return `eval-${timestamp.replace(/[:.]/g, "-")}`;
}

/** Pair each ground-truth record with its profile and document; report gaps as errors. */
export function buildExtractionCases(data: EvalData): { cases: ExtractionCase[]; errors: string[] } {
  const cases: ExtractionCase[] = [];
  const errors: string[] = [];
  for (const gt of data.groundTruths) {
    const profile = data.patients.find((p) => p.id === gt.patientId);
    const document = data.documents.find((d) => d.id === gt.documentId);
    if (!profile) errors.push(`ground-truth:${gt.patientId}: no patient fixture found`);
    if (!document) errors.push(`ground-truth:${gt.patientId}: document ${gt.documentId} not found`);
    if (profile && document) cases.push({ profile, document, groundTruth: gt });
  }
  return { cases, errors };
}

export async function runEvaluation(deps: EvalDeps, data: EvalData): Promise<EvalRun> {
  const timestamp = (deps.now?.() ?? new Date()).toISOString();
  const mode = deps.getAiMode();
  const errors: string[] = [];

  const { cases: extractionCases, errors: pairingErrors } = buildExtractionCases(data);
  errors.push(...pairingErrors);

  const extraction = await runExtractionSuite(extractionCases, deps.extractInstructions);
  errors.push(...extraction.errors);

  const citationInputs: CitationInput[] = extraction.perPatient.flatMap((p) => {
    const doc = extractionCases.find((c) => c.document.id === p.documentId)?.document;
    return doc && p.extracted ? [{ patientId: p.patientId, document: doc, instructions: p.extracted }] : [];
  });
  const citations = runCitationSuite(citationInputs);

  const safety = runSafetySuite(data.safetyTestCases, deps.evaluateSafety);
  errors.push(...safety.errors);

  const comprehensionInputs: ComprehensionCase[] = data.groundTruths.flatMap((gt) => {
    const language = data.patients.find((p) => p.id === gt.patientId)?.language ?? "en";
    return gt.teachBackQuestions.map((question) => ({ question, language }));
  });
  const comprehension = runComprehensionSuite(comprehensionInputs, deps.scoreTeachBack, deps.clarifyTemplate);
  errors.push(...comprehension.errors);

  const cases: EvalCaseResult[] = [
    ...extraction.cases,
    ...citations.cases,
    ...safety.cases,
    ...comprehension.cases,
  ];

  // model_based only when a live model actually produced extraction output.
  const liveSources = extraction.perPatient.filter((p) => p.source === "live");
  const providerReported = extraction.perPatient.some((p) => p.source !== undefined);
  const live = mode === "live_claude" && (providerReported ? liveSources.length > 0 : true);
  const run: EvalRun = {
    runId: makeRunId(timestamp),
    suiteVersion: EVAL_SUITE_VERSION,
    timestamp,
    mode,
    kind: live ? "model_based" : "deterministic_synthetic",
    caseCount: cases.length,
    metrics: {
      instruction_extraction: extraction.metrics,
      citation_validity: citations.metrics,
      safety: safety.metrics,
      comprehension: comprehension.metrics,
    },
    confusion: {
      instruction_extraction: extraction.confusion,
      safety: safety.confusion,
    },
    cases,
    errors,
  };
  if (live) run.modelId = liveSources.find((p) => p.model)?.model ?? deps.getModelId();
  return run;
}

export { runExtractionSuite, matchInstructions, locateSpan, extractedSpan, spanIoU } from "./extraction";
export { runCitationSuite, citationProblem } from "./citations";
export { runSafetySuite } from "./safety";
export { runComprehensionSuite, evaluateQuestion, pickDistractor, defaultClarifyTemplate } from "./comprehension";
export { ratioMetric, countMetric, precisionRecallF1, tokenJaccard, normalizeText } from "./metrics";
export { EvalRunSchema, EvalMetricSchema, EvalCaseResultSchema } from "./schema";
export type { ExtractFn, ExtractionOutput, ExtractionCase, ExtractionSuiteResult, PatientExtractionResult } from "./extraction";
export type { EvaluateSafetyFn, SafetySuiteResult } from "./safety";
export type { ScoreTeachBackFn, ClarifyTemplateFn, TeachBackScore, ComprehensionSuiteResult } from "./comprehension";
export type { CitationInput, CitationSuiteResult } from "./citations";
