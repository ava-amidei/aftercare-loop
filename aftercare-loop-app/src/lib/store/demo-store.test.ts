import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ActionItem,
  CareTeamRequest,
  ChatMessage,
  PatientProfile,
  VisitDocument,
} from "@/lib/types";

// Self-contained fictional fixtures so these tests don't depend on the
// synthetic-patients agent's data.
vi.mock("@/data/patients", () => {
  const mk = (id: string, name: string, language: "en" | "es"): PatientProfile => ({
    id,
    displayName: name,
    ageRange: "30–39",
    language,
    explanationLevel: "standard",
    accessibility: [],
    conditions: ["Test concern"],
    medications: [],
    careInstructions: [],
    healthGoals: [],
    barriers: ["transportation"],
    scenarioSummary: "Fictional test patient",
  });
  const doc = (patientId: string, id: string): VisitDocument => ({
    id,
    patientId,
    title: "Fictional After-Visit Summary",
    text: "Fictional test document text.",
    createdAt: "2026-10-01",
    source: "fixture",
  });
  const patients = [mk("pt-test-b", "Test B", "es"), mk("pt-test-a", "Test A", "en")];
  return {
    DEFAULT_PATIENT_ID: "pt-test-a",
    patients,
    documentsByPatient: {
      "pt-test-a": [doc("pt-test-a", "doc-a-1")],
      "pt-test-b": [doc("pt-test-b", "doc-b-1")],
    },
  };
});

// Node >= 25 exposes an (undefined) global localStorage that shadows jsdom's in
// this vitest setup, so install an in-memory Storage before the store is created.
function installMemoryStorage(): void {
  const data = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => (data.has(k) ? data.get(k)! : null),
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
  Object.defineProperty(window, "localStorage", { value: storage, configurable: true });
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
}
installMemoryStorage();

const { useDemoStore, DEMO_STORE_KEY, nextCareTeamStatus } = await import("./demo-store");
const { buildInitialSessionState, buildInitialStore } = await import("./initial-state");
const {
  selectActiveDocument,
  selectActiveInterpretation,
  selectActivePatient,
  actionsInCategory,
  actionsNeedingClarification,
  actionProgress,
} = await import("./selectors");
const fixtures = await import("@/data/patients");

const A = "pt-test-a";
const B = "pt-test-b";
const store = () => useDemoStore.getState();

const chat = (id: string, content: string): ChatMessage => ({
  id,
  role: "user",
  content,
  createdAt: "2026-11-01T00:00:00.000Z",
});

const action = (id: string, patientId: string, over: Partial<ActionItem> = {}): ActionItem => ({
  id,
  patientId,
  description: `Action ${id}`,
  type: "appointment",
  category: "care_plan",
  origin: "clinician_documented",
  sourceVerification: "verified",
  status: "pending",
  rationale: "Documented in fictional test document",
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  ...over,
});

beforeEach(() => {
  localStorage.clear();
  store().resetDemo();
});

describe("initial state", () => {
  it("builds every fixture patient with its document and no derived data", () => {
    const init = buildInitialStore();
    expect(Object.keys(init.patients)).toEqual([B, A]);
    expect(init.activePatientId).toBe(A);
    expect(init.katOpen).toBe(false);
    const a = init.patients[A];
    expect(a.documents.map((d) => d.id)).toEqual(["doc-a-1"]);
    expect(a.activeDocumentId).toBe("doc-a-1");
    expect(a.interpretations).toEqual({});
    expect(a.actions).toEqual([]);
    expect(a.chat).toEqual([]);
    expect(a.savedQuestions).toEqual([]);
  });

  it("clones fixtures so store state never aliases fixture objects", () => {
    const s = buildInitialSessionState(fixtures.patients[1], fixtures.documentsByPatient[A]);
    expect(s.profile).toEqual(fixtures.patients[1]);
    expect(s.profile).not.toBe(fixtures.patients[1]);
    expect(s.documents[0]).not.toBe(fixtures.documentsByPatient[A][0]);
  });
});

describe("switchPatient / patient scoping", () => {
  it("switches the active patient and ignores unknown ids", () => {
    store().switchPatient(B);
    expect(store().activePatientId).toBe(B);
    expect(store().active().profile.id).toBe(B);
    store().switchPatient("pt-does-not-exist");
    expect(store().activePatientId).toBe(B);
  });

  it("keeps chat and actions strictly per patient", () => {
    store().appendChat(A, chat("m1", "question from A"));
    store().upsertActions(A, [action("act-1", A)]);
    store().switchPatient(B);
    expect(store().active().chat).toEqual([]);
    expect(store().active().actions).toEqual([]);
    store().appendChat(B, chat("m2", "question from B"));
    store().switchPatient(A);
    expect(store().active().chat.map((m) => m.id)).toEqual(["m1"]);
    expect(store().patients[B].chat.map((m) => m.id)).toEqual(["m2"]);
  });

  it("clearChat only clears the given patient", () => {
    store().appendChat(A, chat("m1", "a"));
    store().appendChat(B, chat("m2", "b"));
    store().clearChat(A);
    expect(store().patients[A].chat).toEqual([]);
    expect(store().patients[B].chat).toHaveLength(1);
  });

  it("actions on unknown patients are no-ops", () => {
    const before = store().patients;
    store().appendChat("pt-nope", chat("x", "x"));
    expect(store().patients).toBe(before);
  });
});

describe("profile & documents", () => {
  it("updateProfile patches without changing the id", () => {
    store().updateProfile(A, { language: "es", id: "hijack" } as never);
    expect(store().patients[A].profile.language).toBe("es");
    expect(store().patients[A].profile.id).toBe(A);
    expect(store().patients[B].profile.language).toBe("es"); // unchanged fixture value
  });

  it("addDocument appends, owns and activates; setActiveDocument validates ids", () => {
    const doc: VisitDocument = {
      id: "doc-a-2",
      patientId: "someone-else",
      title: "Pasted",
      text: "Pasted fictional text.",
      createdAt: "2026-11-02",
      source: "pasted",
    };
    store().addDocument(A, doc);
    const a = store().patients[A];
    expect(a.documents.map((d) => d.id)).toEqual(["doc-a-1", "doc-a-2"]);
    expect(a.documents[1].patientId).toBe(A);
    expect(a.activeDocumentId).toBe("doc-a-2");
    store().setActiveDocument(A, "doc-missing");
    expect(store().patients[A].activeDocumentId).toBe("doc-a-2");
    store().setActiveDocument(A, "doc-a-1");
    expect(selectActiveDocument(store())?.id).toBe("doc-a-1");
  });

  it("setInterpretation keys by document id and is visible via selector", () => {
    const interp = {
      documentId: "doc-a-1",
      patientId: A,
      whatThisMeans: "x",
      terms: [],
      whatToKnow: [],
      discussWithProvider: [],
      instructions: [],
      unansweredQuestions: [],
      limitations: [],
      safetyFlags: [],
      referenceIds: [],
      meta: { mode: "scripted_demo" as const, generatedAt: "2026-11-01", disclaimer: "d" },
    };
    store().setInterpretation(A, interp);
    expect(selectActiveInterpretation(store())).toEqual(interp);
    store().switchPatient(B);
    expect(selectActiveInterpretation(store())).toBeUndefined();
    expect(selectActivePatient(store())?.id).toBe(B);
  });
});

describe("actions", () => {
  it("upsertActions replaces by id and appends new ones in order", () => {
    store().upsertActions(A, [action("1", A), action("2", A)]);
    store().upsertActions(A, [action("2", A, { description: "updated" }), action("3", A)]);
    const acts = store().patients[A].actions;
    expect(acts.map((a) => a.id)).toEqual(["1", "2", "3"]);
    expect(acts[1].description).toBe("updated");
  });

  it("setActionStatus updates status + updatedAt for that action only", () => {
    store().upsertActions(A, [action("1", A), action("2", A)]);
    store().setActionStatus(A, "1", "completed");
    const [one, two] = store().patients[A].actions;
    expect(one.status).toBe("completed");
    expect(one.updatedAt).not.toBe("2026-11-01T00:00:00.000Z");
    expect(two.status).toBe("pending");
  });

  it("addReminder attaches an in-app reminder", () => {
    store().upsertActions(A, [action("1", A)]);
    store().addReminder(A, "1", { at: "2026-11-10T09:00:00.000Z", label: "r", dismissed: false });
    expect(store().patients[A].actions[0].reminder?.label).toBe("r");
  });

  it("selectors keep unverified clinician items out of the care plan", () => {
    const acts = [
      action("v", A),
      action("u", A, { sourceVerification: "unverified" }),
      action("g", A, { category: "wellness_goal", origin: "patient_selected", sourceVerification: "not_applicable", status: "completed" }),
    ];
    expect(actionsInCategory(acts, "care_plan").map((a) => a.id)).toEqual(["v"]);
    expect(actionsNeedingClarification(acts).map((a) => a.id)).toEqual(["u"]);
    expect(actionProgress(acts)).toEqual({ completed: 1, total: 2 });
  });
});

describe("questions, teach-back, summary, care team", () => {
  it("saved questions are trimmed, de-duplicated and removable", () => {
    store().addSavedQuestion(A, "  What is next?  ");
    store().addSavedQuestion(A, "What is next?");
    store().addSavedQuestion(A, "   ");
    expect(store().patients[A].savedQuestions).toEqual(["What is next?"]);
    store().removeSavedQuestion(A, "What is next?");
    expect(store().patients[A].savedQuestions).toEqual([]);
  });

  it("upsertTeachBack stores sessions by question id", () => {
    const session = {
      questionId: "q1",
      patientId: A,
      attempts: [],
      clarificationProvided: false,
      savedForClinician: false,
      completed: false,
    };
    store().upsertTeachBack(A, session);
    store().upsertTeachBack(A, { ...session, completed: true });
    expect(store().patients[A].teachBack.q1.completed).toBe(true);
    expect(store().patients[B].teachBack).toEqual({});
  });

  it("setCommunicationSummary stores per patient", () => {
    store().setCommunicationSummary(A, {
      patientId: A,
      generatedAt: "2026-11-01",
      questions: [],
      barriers: [],
      unresolvedItems: [],
      documentedInstructions: [],
      text: "summary",
    });
    expect(store().patients[A].communicationSummary?.text).toBe("summary");
    expect(store().patients[B].communicationSummary).toBeUndefined();
  });

  it("care-team requests advance submitted → in_review → responded → closed", () => {
    const req: CareTeamRequest = {
      id: "r1",
      patientId: A,
      type: "clarification",
      summary: "s",
      status: "submitted",
      createdAt: "2026-11-01",
      updatedAt: "2026-11-01",
      simulated: true,
    };
    store().addCareTeamRequest(A, req);
    const statuses = [];
    for (let i = 0; i < 4; i++) {
      store().advanceCareTeamRequest(A, "r1");
      statuses.push(store().patients[A].careTeamRequests[0].status);
    }
    expect(statuses).toEqual(["in_review", "responded", "closed", "closed"]);
    expect(nextCareTeamStatus("closed")).toBe("closed");
  });
});

describe("Kat panel", () => {
  it("setKatOpen records first open for the active patient only", () => {
    store().setKatOpen(true);
    expect(store().katOpen).toBe(true);
    expect(store().katHasOpenedOnce).toEqual({ [A]: true });
    store().setKatOpen(false);
    expect(store().katHasOpenedOnce).toEqual({ [A]: true });
  });
});

describe("resetDemo", () => {
  it("restores ALL patients, default active patient, and closes Kat", () => {
    store().appendChat(A, chat("m1", "a"));
    store().appendChat(B, chat("m2", "b"));
    store().upsertActions(B, [action("1", B)]);
    store().updateProfile(B, { displayName: "Edited" });
    store().addSavedQuestion(A, "q");
    store().switchPatient(B);
    store().setKatOpen(true);

    store().resetDemo();

    const s = store();
    expect(s.activePatientId).toBe(A);
    expect(s.katOpen).toBe(false);
    expect(s.katHasOpenedOnce).toEqual({});
    for (const id of [A, B]) {
      expect(s.patients[id].chat).toEqual([]);
      expect(s.patients[id].actions).toEqual([]);
      expect(s.patients[id].savedQuestions).toEqual([]);
    }
    expect(s.patients[B].profile.displayName).toBe("Test B");
    expect(s.patients).toEqual(buildInitialStore().patients);
  });
});

describe("persistence", () => {
  it("writes to localStorage under the v1 key without katOpen", () => {
    store().appendChat(A, chat("m1", "persist me"));
    store().setKatOpen(true);
    const raw = JSON.parse(localStorage.getItem(DEMO_STORE_KEY) ?? "null");
    expect(raw.version).toBe(1);
    expect(raw.state.patients[A].chat[0].content).toBe("persist me");
    expect(raw.state).not.toHaveProperty("katOpen");
  });

  it("rehydrates persisted sessions and drops patients not in fixtures", async () => {
    const persisted = buildInitialStore();
    persisted.patients[B].chat = [chat("m9", "from storage")];
    localStorage.setItem(
      DEMO_STORE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          activePatientId: B,
          patients: { ...persisted.patients, "pt-ghost": persisted.patients[A] },
          katHasOpenedOnce: { [B]: true },
        },
      }),
    );
    await useDemoStore.persist.rehydrate();
    expect(store().activePatientId).toBe(B);
    expect(store().patients[B].chat[0].content).toBe("from storage");
    expect(store().patients).not.toHaveProperty("pt-ghost");
    expect(store().katHasOpenedOnce[B]).toBe(true);
  });

  it("resets to fixtures on version mismatch", async () => {
    localStorage.setItem(
      DEMO_STORE_KEY,
      JSON.stringify({
        version: 0,
        state: { activePatientId: B, patients: { [B]: { broken: true } }, katHasOpenedOnce: {} },
      }),
    );
    await useDemoStore.persist.rehydrate();
    expect(store().activePatientId).toBe(A);
    expect(store().patients).toEqual(buildInitialStore().patients);
  });
});
