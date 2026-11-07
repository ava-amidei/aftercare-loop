// STUB — replaced by the synthetic-patients agent. Keep these export names.
import type { PatientGroundTruth, PatientId, SafetyTestCase } from "@/lib/types";

export const groundTruthByPatient: Record<PatientId, PatientGroundTruth> = {};
export const safetyTestCases: SafetyTestCase[] = [];
export function getGroundTruth(id: PatientId): PatientGroundTruth | undefined {
  return groundTruthByPatient[id];
}
