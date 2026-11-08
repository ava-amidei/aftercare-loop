/**
 * Client demo-state store (ARCHITECTURE §6). zustand v5 + persist → localStorage.
 *
 * Everything is patient-scoped: every mutating action takes a patient id and
 * only touches `patients[id]`, so switching patients never leaks chat,
 * actions or progress between fictional patients.
 *
 * Hydration: `skipHydration: true` keeps the first client render identical to
 * the server render (fixture state). Call `useHasHydrated()` (./hydration) —
 * it triggers `persist.rehydrate()` once after mount.
 */
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type {
  ActionId,
  AppearancePrefs,
  ActionItem,
  ActionStatus,
  CareTeamRequest,
  CareTeamRequestStatus,
  ChatMessage,
  CommunicationSummary,
  DocumentId,
  DocumentInterpretation,
  PatientId,
  PatientProfile,
  PatientSessionState,
  Reminder,
  TeachBackSession,
  VisitDocument,
} from "@/lib/types";
import {
  buildInitialStore,
  placeholderSession,
  resolveDefaultPatientId,
  type DemoStoreData,
} from "./initial-state";
import { mergeAppearance, sanitizeAppearance } from "./appearance";

export const DEMO_STORE_KEY = "aftercare-loop-demo-v1";
export const DEMO_STORE_VERSION = 1;

export interface DemoStoreActions {
  /** Active patient's session (stable placeholder if fixtures are missing). */
  active(): PatientSessionState;
  switchPatient(id: PatientId): void;
  updateProfile(id: PatientId, patch: Partial<Omit<PatientProfile, "id">>): void;
  /** Adds (or replaces by id) a document and makes it the active document. */
  addDocument(id: PatientId, doc: VisitDocument): void;
  setActiveDocument(id: PatientId, docId: DocumentId): void;
  setInterpretation(id: PatientId, interp: DocumentInterpretation): void;
  /** Replaces items with matching ids, appends new ones (order preserved). */
  upsertActions(id: PatientId, items: ActionItem[]): void;
  setActionStatus(id: PatientId, actionId: ActionId, status: ActionStatus): void;
  addReminder(id: PatientId, actionId: ActionId, reminder: Reminder): void;
  appendChat(id: PatientId, msg: ChatMessage): void;
  clearChat(id: PatientId): void;
  upsertTeachBack(id: PatientId, session: TeachBackSession): void;
  /** Trimmed, de-duplicated; empty strings ignored. */
  addSavedQuestion(id: PatientId, q: string): void;
  removeSavedQuestion(id: PatientId, q: string): void;
  setCommunicationSummary(id: PatientId, s: CommunicationSummary): void;
  addCareTeamRequest(id: PatientId, r: CareTeamRequest): void;
  /** submitted → in_review → responded → closed (closed stays closed). */
  advanceCareTeamRequest(id: PatientId, reqId: string): void;
  /**
   * Per-patient appearance (accent + font scale). Merges the patch; a key set
   * to `undefined` clears it; invalid values are ignored. Reset by resetDemo().
   */
  setAppearance(id: PatientId, patch: Partial<AppearancePrefs>): void;
  /** Opening also records katHasOpenedOnce[activePatientId] = true. */
  setKatOpen(open: boolean): void;
  /** Restores fixtures for ALL patients, active = DEFAULT_PATIENT_ID, Kat closed. */
  resetDemo(): void;
}

export type DemoStore = DemoStoreData & DemoStoreActions;

/** Persisted subset (katOpen is intentionally not persisted). */
export type PersistedDemoState = Pick<
  DemoStoreData,
  "activePatientId" | "patients" | "katHasOpenedOnce"
>;

const CARE_TEAM_FLOW: Record<CareTeamRequestStatus, CareTeamRequestStatus> = {
  submitted: "in_review",
  in_review: "responded",
  responded: "closed",
  closed: "closed",
};

/** Local pure transition (mirrors services/care-team advanceRequest contract). */
export function nextCareTeamStatus(status: CareTeamRequestStatus): CareTeamRequestStatus {
  return CARE_TEAM_FLOW[status];
}

const nowIso = () => new Date().toISOString();

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function toPersisted(s: DemoStoreData): PersistedDemoState {
  return {
    activePatientId: s.activePatientId,
    patients: s.patients,
    katHasOpenedOnce: s.katHasOpenedOnce,
  };
}

export const useDemoStore = create<DemoStore>()(
  persist(
    (set, get) => {
      /** Immutable update of one patient's session; no-op for unknown ids. */
      const updatePatient = (
        id: PatientId,
        fn: (s: PatientSessionState) => PatientSessionState,
      ) =>
        set((state) => {
          const cur = state.patients[id];
          if (!cur) return state;
          return { patients: { ...state.patients, [id]: fn(cur) } };
        });

      return {
        ...buildInitialStore(),

        active: () => {
          const { patients, activePatientId } = get();
          return patients[activePatientId] ?? placeholderSession(activePatientId);
        },

        switchPatient: (id) =>
          set((state) => (state.patients[id] ? { activePatientId: id } : state)),

        updateProfile: (id, patch) =>
          updatePatient(id, (s) => ({ ...s, profile: { ...s.profile, ...patch, id: s.profile.id } })),

        addDocument: (id, doc) =>
          updatePatient(id, (s) => {
            const docWithOwner = { ...doc, patientId: id };
            const exists = s.documents.some((d) => d.id === doc.id);
            return {
              ...s,
              documents: exists
                ? s.documents.map((d) => (d.id === doc.id ? docWithOwner : d))
                : [...s.documents, docWithOwner],
              activeDocumentId: doc.id,
            };
          }),

        setActiveDocument: (id, docId) =>
          updatePatient(id, (s) =>
            s.documents.some((d) => d.id === docId) ? { ...s, activeDocumentId: docId } : s,
          ),

        setInterpretation: (id, interp) =>
          updatePatient(id, (s) => ({
            ...s,
            interpretations: { ...s.interpretations, [interp.documentId]: interp },
          })),

        upsertActions: (id, items) =>
          updatePatient(id, (s) => {
            const incoming = new Map(items.map((i) => [i.id, i] as const));
            const merged = s.actions.map((a) => incoming.get(a.id) ?? a);
            const existingIds = new Set(s.actions.map((a) => a.id));
            for (const item of incoming.values()) {
              if (!existingIds.has(item.id)) merged.push(item);
            }
            return { ...s, actions: merged };
          }),

        setActionStatus: (id, actionId, status) =>
          updatePatient(id, (s) => ({
            ...s,
            actions: s.actions.map((a) =>
              a.id === actionId ? { ...a, status, updatedAt: nowIso() } : a,
            ),
          })),

        addReminder: (id, actionId, reminder) =>
          updatePatient(id, (s) => ({
            ...s,
            actions: s.actions.map((a) =>
              a.id === actionId ? { ...a, reminder, updatedAt: nowIso() } : a,
            ),
          })),

        appendChat: (id, msg) => updatePatient(id, (s) => ({ ...s, chat: [...s.chat, msg] })),

        clearChat: (id) => updatePatient(id, (s) => ({ ...s, chat: [] })),

        upsertTeachBack: (id, session) =>
          updatePatient(id, (s) => ({
            ...s,
            teachBack: { ...s.teachBack, [session.questionId]: session },
          })),

        addSavedQuestion: (id, q) =>
          updatePatient(id, (s) => {
            const text = q.trim();
            if (!text || s.savedQuestions.includes(text)) return s;
            return { ...s, savedQuestions: [...s.savedQuestions, text] };
          }),

        removeSavedQuestion: (id, q) =>
          updatePatient(id, (s) => ({
            ...s,
            savedQuestions: s.savedQuestions.filter((x) => x !== q && x !== q.trim()),
          })),

        setCommunicationSummary: (id, summary) =>
          updatePatient(id, (s) => ({ ...s, communicationSummary: summary })),

        addCareTeamRequest: (id, r) =>
          updatePatient(id, (s) => {
            const req = { ...r, patientId: id };
            const exists = s.careTeamRequests.some((x) => x.id === r.id);
            return {
              ...s,
              careTeamRequests: exists
                ? s.careTeamRequests.map((x) => (x.id === r.id ? req : x))
                : [...s.careTeamRequests, req],
            };
          }),

        advanceCareTeamRequest: (id, reqId) =>
          updatePatient(id, (s) => ({
            ...s,
            careTeamRequests: s.careTeamRequests.map((r) =>
              r.id === reqId && r.status !== "closed"
                ? { ...r, status: nextCareTeamStatus(r.status), updatedAt: nowIso() }
                : r,
            ),
          })),

        setAppearance: (id, patch) =>
          updatePatient(id, (s) => {
            const appearance = mergeAppearance(s.appearance, patch);
            if (!appearance) {
              if (!s.appearance) return s;
              const { appearance: _drop, ...rest } = s;
              void _drop;
              return rest;
            }
            return { ...s, appearance };
          }),

        setKatOpen: (open) =>
          set((state) => ({
            katOpen: open,
            katHasOpenedOnce: open
              ? { ...state.katHasOpenedOnce, [state.activePatientId]: true }
              : state.katHasOpenedOnce,
          })),

        resetDemo: () => set({ ...buildInitialStore(), katOpen: false }),
      };
    },
    {
      name: DEMO_STORE_KEY,
      version: DEMO_STORE_VERSION,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" && window.localStorage ? window.localStorage : noopStorage,
      ),
      partialize: (s): PersistedDemoState => toPersisted(s),
      // Only called on version mismatch: discard old data, start from fixtures.
      migrate: () => toPersisted(buildInitialStore()),
      // Keep persisted sessions only for patients that still exist in fixtures;
      // fixture patients added later get fresh sessions.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PersistedDemoState>;
        const patients = { ...current.patients };
        for (const [pid, session] of Object.entries(p.patients ?? {})) {
          if (patients[pid] && session && typeof session === "object") {
            // Drop malformed persisted appearance rather than applying it.
            const appearance = sanitizeAppearance(session.appearance);
            const { appearance: _old, ...rest } = session;
            void _old;
            patients[pid] = appearance ? { ...rest, appearance } : rest;
          }
        }
        const activePatientId =
          p.activePatientId && patients[p.activePatientId]
            ? p.activePatientId
            : resolveDefaultPatientId(patients);
        return {
          ...current,
          patients,
          activePatientId,
          katHasOpenedOnce: { ...current.katHasOpenedOnce, ...(p.katHasOpenedOnce ?? {}) },
        };
      },
      skipHydration: true,
    },
  ),
);
