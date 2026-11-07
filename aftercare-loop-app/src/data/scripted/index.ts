/**
 * Scripted Demo Mode content index (deterministic, predefined responses for the
 * fictional demo patients). Consumers should go through `@/lib/ai/scripted`;
 * this module only exposes the raw content and lookups by id.
 */
import type { PatientId, QuestionId } from "@/lib/types";
import { scriptedPtA } from "./pt-a-pcos";
import { scriptedPtB } from "./pt-b-postpartum";
import { scriptedPtC } from "./pt-c-endometriosis";
import { scriptedPtD } from "./pt-d-pots";
import { scriptedPtE } from "./pt-e-multi";
import { scriptedPtF } from "./pt-f-gdm-es";
import { scriptedPtI } from "./pt-i-anemia-es";
import type { ScriptedPatientContent } from "./types";

export type {
  ScriptedFreeTextEntry,
  ScriptedInterpretationContent,
  ScriptedKatAction,
  ScriptedKatReply,
  ScriptedPatientContent,
  ScriptedTerm,
} from "./types";
export { buildScriptedInterpretation, instructionsFromGroundTruth, locateFirst } from "./helpers";

/** Fully supported scripted demo patients (SPEC §12.12: A, B, C). */
export const SCRIPTED_PRIMARY_PATIENT_IDS: PatientId[] = [
  scriptedPtA.patientId,
  scriptedPtB.patientId,
  scriptedPtC.patientId,
];

export const scriptedContent: ScriptedPatientContent[] = [
  scriptedPtA,
  scriptedPtB,
  scriptedPtC,
  scriptedPtD,
  scriptedPtE,
  // Spanish-language (es) scripted scenarios.
  scriptedPtF,
  scriptedPtI,
];

const byPatient: ReadonlyMap<PatientId, ScriptedPatientContent> = new Map(
  scriptedContent.map((c) => [c.patientId, c]),
);

const clarificationsByQuestion: ReadonlyMap<QuestionId, readonly [string, string]> = new Map(
  scriptedContent.flatMap((c) => Object.entries(c.clarifications)),
);

export function getScriptedContent(patientId: PatientId): ScriptedPatientContent | undefined {
  return byPatient.get(patientId);
}

export function getScriptedClarifications(questionId: QuestionId): readonly [string, string] | undefined {
  return clarificationsByQuestion.get(questionId);
}
