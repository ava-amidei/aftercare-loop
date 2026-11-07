/**
 * Selectors over the demo store. Hooks return existing references (or
 * undefined) so they are safe with zustand v5's strict equality.
 */
import { useShallow } from "zustand/react/shallow";
import type {
  ActionCategory,
  ActionItem,
  DocumentInterpretation,
  PatientProfile,
  PatientSessionState,
  VisitDocument,
} from "@/lib/types";
import { useDemoStore, type DemoStore } from "./demo-store";

// ---- pure selectors -------------------------------------------------------

export const selectActiveSession = (s: DemoStore): PatientSessionState | undefined =>
  s.patients[s.activePatientId];

export const selectActivePatient = (s: DemoStore): PatientProfile | undefined =>
  selectActiveSession(s)?.profile;

export const selectActiveDocument = (s: DemoStore): VisitDocument | undefined => {
  const session = selectActiveSession(s);
  if (!session?.activeDocumentId) return undefined;
  return session.documents.find((d) => d.id === session.activeDocumentId);
};

export const selectActiveInterpretation = (s: DemoStore): DocumentInterpretation | undefined => {
  const session = selectActiveSession(s);
  if (!session?.activeDocumentId) return undefined;
  return session.interpretations[session.activeDocumentId];
};

/**
 * Clinician-documented items whose source quote is not verified. These never
 * appear in My Care Plan (ARCHITECTURE §2.5); show them under "Needs clarification".
 */
export function isUnverifiedClinicianItem(a: ActionItem): boolean {
  return a.origin === "clinician_documented" && a.sourceVerification !== "verified";
}

/** Items for one Action Plan category, excluding unverified clinician items. */
export function actionsInCategory(actions: ActionItem[], category: ActionCategory): ActionItem[] {
  return actions.filter((a) => a.category === category && !isUnverifiedClinicianItem(a));
}

export function actionsNeedingClarification(actions: ActionItem[]): ActionItem[] {
  return actions.filter((a) => isUnverifiedClinicianItem(a) || a.status === "needs_clarification");
}

export function actionProgress(actions: ActionItem[]): { completed: number; total: number } {
  const counted = actions.filter((a) => !isUnverifiedClinicianItem(a));
  return {
    completed: counted.filter((a) => a.status === "completed").length,
    total: counted.length,
  };
}

// ---- hooks ---------------------------------------------------------------

export const useActivePatientId = () => useDemoStore((s) => s.activePatientId);
export const useActiveSession = () => useDemoStore(selectActiveSession);
export const useActivePatient = () => useDemoStore(selectActivePatient);
export const useActiveDocument = () => useDemoStore(selectActiveDocument);
export const useActiveInterpretation = () => useDemoStore(selectActiveInterpretation);

const EMPTY_ACTIONS: ActionItem[] = [];
export const useActiveActions = () =>
  useDemoStore((s) => selectActiveSession(s)?.actions ?? EMPTY_ACTIONS);

/** All fixture patient profiles, in fixture order (for the patient switcher). */
export const usePatientProfiles = (): PatientProfile[] =>
  useDemoStore(useShallow((s) => Object.values(s.patients).map((p) => p.profile)));
