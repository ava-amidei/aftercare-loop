/**
 * Wires the evaluation harness to the real services and fixtures. Node/server
 * only (pulls in the Claude client via the extraction service).
 */
import type { TeachBackQuestion } from "@/lib/types";
import { getAiMode, getModelId } from "@/lib/ai/client";
import { getScriptedClarification } from "@/lib/ai/scripted";
import { evaluateSafety } from "@/lib/safety";
import { extractInstructionsDetailed } from "@/lib/services/instruction-extraction";
import { buildTemplateClarification, scoreTeachBack } from "@/lib/services/teach-back";
import { patientFixtures } from "@/data/patients";
import { groundTruths, safetyTestCases } from "@/data/ground-truth";
import type { ClarifyTemplateFn } from "./comprehension";
import { runEvaluation, type EvalData, type EvalDeps } from "./index";

/**
 * The teach-back service's deterministic path: a scripted clarification when one
 * exists for the question, else its template built from the question record.
 * Never a live model call.
 */
export const scriptedOrTemplateClarify: ClarifyTemplateFn = ({ question, language, misunderstanding }) =>
  getScriptedClarification(question.id, 1) ?? buildTemplateClarification(question, language, misunderstanding);

export function createDefaultDeps(overrides: Partial<EvalDeps> = {}): EvalDeps {
  return {
    // extractInstructions' detailed variant, so the run records which path (live/scripted/heuristic) ran.
    extractInstructions: (input) => extractInstructionsDetailed(input),
    evaluateSafety: (text) => evaluateSafety(text),
    scoreTeachBack: (question: TeachBackQuestion, response: string) => scoreTeachBack(question, response),
    clarifyTemplate: scriptedOrTemplateClarify,
    getAiMode,
    getModelId,
    ...overrides,
  };
}

export function loadFixtureData(): EvalData {
  return {
    patients: patientFixtures.map((f) => f.profile),
    documents: patientFixtures.map((f) => f.document),
    groundTruths,
    safetyTestCases,
  };
}

export function runDefaultEvaluation(overrides: Partial<EvalDeps> = {}) {
  return runEvaluation(createDefaultDeps(overrides), loadFixtureData());
}
