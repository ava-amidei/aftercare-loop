// STUB — replaced by the synthetic-patients agent. Keep these export names.
import type { PatientId, PatientProfile, VisitDocument } from "@/lib/types";

export const DEFAULT_PATIENT_ID: PatientId = "pt-a-pcos";
export const patients: PatientProfile[] = [];
export const documentsByPatient: Record<PatientId, VisitDocument[]> = {};
export function getPatient(id: PatientId): PatientProfile | undefined {
  return patients.find((p) => p.id === id);
}
export function getDocuments(id: PatientId): VisitDocument[] {
  return documentsByPatient[id] ?? [];
}
