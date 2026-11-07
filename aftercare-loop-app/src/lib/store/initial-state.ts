/**
 * Initial (fixture) state for the client demo store.
 *
 * Fixture patients come pre-loaded with their visit document(s) but with NO
 * interpretation, actions, chat or progress, so the demo can show the
 * Understand step live (ARCHITECTURE §6). All data is fictional.
 */
import {
  DEFAULT_PATIENT_ID,
  documentsByPatient,
  patients as fixturePatients,
} from "@/data/patients";
import type {
  PatientId,
  PatientProfile,
  PatientSessionState,
  VisitDocument,
} from "@/lib/types";

/** Persisted + runtime data portion of the store (no actions). */
export interface DemoStoreData {
  activePatientId: PatientId;
  patients: Record<PatientId, PatientSessionState>;
  katOpen: boolean;
  katHasOpenedOnce: Record<PatientId, boolean>;
}

/** Fixtures are plain JSON-shaped data; a JSON clone guarantees no shared references. */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function buildInitialSessionState(
  profile: PatientProfile,
  documents: VisitDocument[],
): PatientSessionState {
  const docs = clone(documents);
  return {
    profile: clone(profile),
    documents: docs,
    activeDocumentId: docs[0]?.id,
    interpretations: {},
    actions: [],
    chat: [],
    teachBack: {},
    communicationSummary: undefined,
    careTeamRequests: [],
    savedQuestions: [],
  };
}

/** Builds a fresh session for every fixture patient, in fixture order. */
export function buildInitialPatients(): Record<PatientId, PatientSessionState> {
  const out: Record<PatientId, PatientSessionState> = {};
  for (const profile of fixturePatients) {
    out[profile.id] = buildInitialSessionState(profile, documentsByPatient[profile.id] ?? []);
  }
  return out;
}

/** DEFAULT_PATIENT_ID when it exists in the fixtures, else the first fixture patient. */
export function resolveDefaultPatientId(
  patients: Record<PatientId, PatientSessionState>,
): PatientId {
  if (patients[DEFAULT_PATIENT_ID]) return DEFAULT_PATIENT_ID;
  return Object.keys(patients)[0] ?? DEFAULT_PATIENT_ID;
}

export function buildInitialStore(): DemoStoreData {
  const patients = buildInitialPatients();
  return {
    activePatientId: resolveDefaultPatientId(patients),
    patients,
    katOpen: false,
    katHasOpenedOnce: {},
  };
}

/**
 * Stable placeholder used by `active()` when the active id has no session
 * (only possible while fixtures are missing). Cached so selectors stay stable.
 */
const placeholderCache = new Map<PatientId, PatientSessionState>();
export function placeholderSession(id: PatientId): PatientSessionState {
  let s = placeholderCache.get(id);
  if (!s) {
    s = buildInitialSessionState(
      {
        id,
        displayName: "",
        ageRange: "",
        language: "en",
        explanationLevel: "standard",
        accessibility: [],
        conditions: [],
        medications: [],
        careInstructions: [],
        healthGoals: [],
        barriers: [],
        scenarioSummary: "",
      },
      [],
    );
    placeholderCache.set(id, s);
  }
  return s;
}
