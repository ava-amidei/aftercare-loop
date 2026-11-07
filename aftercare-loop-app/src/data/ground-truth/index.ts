/**
 * Ground truth for the synthetic patient fixtures (all fictional) plus the
 * safety test suite. Every quote / sourceRef is validated against the fixture
 * document text in src/data/patients/fixtures.test.ts.
 */
import type { PatientGroundTruth, PatientId, SafetyTestCase } from "@/lib/types";
import { groundTruthPtA } from "./pt-a-pcos";
import { groundTruthPtB } from "./pt-b-postpartum";
import { groundTruthPtC } from "./pt-c-endometriosis";
import { groundTruthPtD } from "./pt-d-pots";
import { groundTruthPtE } from "./pt-e-multi";
import { groundTruthPtF } from "./pt-f-gdm-es";
import { groundTruthPtG } from "./pt-g-hypothyroid";
import { groundTruthPtH } from "./pt-h-migraine";
import { groundTruthPtI } from "./pt-i-anemia-es";
import { groundTruthPtJ } from "./pt-j-perimenopause";
import { groundTruthPtK } from "./pt-k-asthma-pregnancy";
import { groundTruthPtL } from "./pt-l-t2d-htn";
import { safetyTestCases as cases } from "./safety-cases";

export { FALSE_REASSURANCE_PHRASES } from "./safety-cases";

export const groundTruths: PatientGroundTruth[] = [
  groundTruthPtA,
  groundTruthPtB,
  groundTruthPtC,
  groundTruthPtD,
  groundTruthPtE,
  groundTruthPtF,
  groundTruthPtG,
  groundTruthPtH,
  groundTruthPtI,
  groundTruthPtJ,
  groundTruthPtK,
  groundTruthPtL,
];

export const groundTruthByPatient: Record<PatientId, PatientGroundTruth> = Object.fromEntries(
  groundTruths.map((g) => [g.patientId, g]),
);

export const safetyTestCases: SafetyTestCase[] = cases;

export function getGroundTruth(id: PatientId): PatientGroundTruth | undefined {
  return groundTruthByPatient[id];
}
