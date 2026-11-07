/**
 * Synthetic patient fixtures (all fictional). One file per patient; this index
 * is the only public entry point. Consumers must not branch on patient ids or
 * condition names — the data drives the UI, not the other way round.
 */
import type { PatientId, PatientProfile, VisitDocument } from "@/lib/types";
import type { PatientFixture } from "./document-builder";
import { ptAPcos } from "./pt-a-pcos";
import { ptBPostpartum } from "./pt-b-postpartum";
import { ptCEndometriosis } from "./pt-c-endometriosis";
import { ptDPots } from "./pt-d-pots";
import { ptEMulti } from "./pt-e-multi";
import { ptFGdmEs } from "./pt-f-gdm-es";
import { ptGHypothyroid } from "./pt-g-hypothyroid";
import { ptHMigraine } from "./pt-h-migraine";
import { ptIAnemiaEs } from "./pt-i-anemia-es";
import { ptJPerimenopause } from "./pt-j-perimenopause";
import { ptKAsthmaPregnancy } from "./pt-k-asthma-pregnancy";
import { ptLT2dHtn } from "./pt-l-t2d-htn";

export type { PatientFixture } from "./document-builder";
export { deriveSections, exactRef, slugify } from "./document-builder";

export const DEFAULT_PATIENT_ID: PatientId = "pt-a-pcos";

/** Ordered: the five primary demo patients (A–E) first, then additional fixtures. */
export const patientFixtures: PatientFixture[] = [
  ptAPcos,
  ptBPostpartum,
  ptCEndometriosis,
  ptDPots,
  ptEMulti,
  ptFGdmEs,
  ptGHypothyroid,
  ptHMigraine,
  ptIAnemiaEs,
  ptJPerimenopause,
  ptKAsthmaPregnancy,
  ptLT2dHtn,
];

/** Ids of the five primary demo scenarios from SPEC §6. */
export const PRIMARY_PATIENT_IDS: PatientId[] = patientFixtures.slice(0, 5).map((f) => f.profile.id);

export const patients: PatientProfile[] = patientFixtures.map((f) => f.profile);

export const documentsByPatient: Record<PatientId, VisitDocument[]> = Object.fromEntries(
  patientFixtures.map((f) => [f.profile.id, [f.document]]),
);

export function getPatient(id: PatientId): PatientProfile | undefined {
  return patients.find((p) => p.id === id);
}

export function getDocuments(id: PatientId): VisitDocument[] {
  return documentsByPatient[id] ?? [];
}

/** Lookup a fixture document by id across all patients. */
export function getDocument(id: string): VisitDocument | undefined {
  return patientFixtures.find((f) => f.document.id === id)?.document;
}
