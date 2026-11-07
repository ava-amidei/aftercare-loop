import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ActionItem } from "@/lib/types";
import { ToastProvider } from "@/components/ui";
import { DEMO_STORE_KEY, useDemoStore } from "@/lib/store";
import { exactRef } from "@/data/patients";
import { ActionPlanView } from "./ActionPlanView";

// Node >= 25 exposes an undefined global localStorage that shadows jsdom's, so
// install an in-memory Storage before the store module is created (hoisted).
vi.hoisted(() => {
  const data = new Map<string, string>();
  const storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    key: (i: number) => [...data.keys()][i] ?? null,
    removeItem: (k: string) => void data.delete(k),
    setItem: (k: string, v: string) => void data.set(k, String(v)),
  };
  Object.defineProperty(window, "localStorage", { value: storage, configurable: true });
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
});

const NOW = "2026-11-07T12:00:00.000Z";

function activeFixture() {
  const s = useDemoStore.getState();
  const session = s.patients[s.activePatientId];
  const doc = session.documents.find((d) => d.id === session.activeDocumentId)!;
  return { patientId: s.activePatientId, doc, session };
}

function verifiedCareItem(): ActionItem {
  const { patientId, doc } = activeFixture();
  // First full sentence of the fictional document, used as an exact quote.
  const quote = doc.text.split("\n").find((l) => l.trim().length > 20)!.trim();
  return {
    id: "act-test-care",
    patientId,
    documentId: doc.id,
    description: "Fictional documented step",
    type: "appointment",
    category: "care_plan",
    origin: "clinician_documented",
    sourceRef: exactRef(doc, quote),
    sourceVerification: "verified",
    status: "pending",
    rationale: `Documented in ${doc.title}`,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function barrierItem(): ActionItem {
  const { patientId } = activeFixture();
  return {
    id: "act-test-barrier",
    patientId,
    description: "Would you like to ask your clinic whether a telehealth appointment is available?",
    type: "administrative",
    category: "provider_question",
    origin: "ai_suggested",
    sourceVerification: "not_applicable",
    status: "pending",
    rationale: "Suggested because you reported: transportation",
    addressesBarrier: "transportation",
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function unverifiedItem(): ActionItem {
  const { patientId, doc } = activeFixture();
  return {
    id: "act-test-unverified",
    patientId,
    documentId: doc.id,
    description: "Clarify: a step that is not in the document",
    type: "question_for_provider",
    category: "provider_question",
    origin: "ai_suggested",
    sourceVerification: "unverified",
    status: "needs_clarification",
    rationale: "Could not be matched.",
    createdAt: NOW,
    updatedAt: NOW,
  };
}

const renderView = (fetchImpl?: typeof fetch) =>
  render(
    <ToastProvider>
      <ActionPlanView fetchImpl={fetchImpl} />
    </ToastProvider>,
  );

async function hydrated() {
  await waitFor(() => expect(useDemoStore.persist.hasHydrated()).toBe(true));
}

beforeEach(() => {
  act(() => useDemoStore.getState().resetDemo());
});

afterEach(() => {
  cleanup();
});

describe("ActionPlanView", () => {
  it("shows an empty state linking to Understand when there are no actions", async () => {
    renderView();
    await hydrated();
    const link = await screen.findByRole("link", { name: /go to understand my health/i });
    expect(link).toHaveAttribute("href", "/understand");
  });

  it("renders three sections with counts, origin labels and separate barrier suggestions", async () => {
    const { patientId } = activeFixture();
    act(() => useDemoStore.getState().upsertActions(patientId, [verifiedCareItem(), barrierItem(), unverifiedItem()]));
    renderView();
    await hydrated();

    expect(await screen.findByTestId("count-care_plan")).toHaveTextContent("1");
    expect(screen.getByTestId("count-wellness_goal")).toHaveTextContent("0");
    expect(screen.getByTestId("count-provider_question")).toHaveTextContent("1");

    const care = screen.getByTestId("section-care_plan");
    expect(within(care).getByText("Fictional documented step")).toBeInTheDocument();
    expect(within(care).getByText("From your clinician")).toBeInTheDocument();

    const clarify = screen.getByTestId("needs-clarification");
    expect(within(clarify).getByText("Clarify: a step that is not in the document")).toBeInTheDocument();
    expect(within(care).queryByText(/a step that is not in the document/)).toBeNull();

    const barrier = screen.getByTestId("barrier-suggestions");
    expect(within(barrier).getByText(/Because you mentioned transportation/)).toBeInTheDocument();
    expect(within(barrier).getByText("Suggested by Kat")).toBeInTheDocument();
    expect(within(care).queryByText(/telehealth/)).toBeNull();

    await userEvent.click(within(barrier).getByRole("button", { name: /add to my questions/i }));
    // Saved in clinic-facing wording, never as the "Would you like to ask…" prompt.
    const saved = useDemoStore.getState().patients[patientId].savedQuestions;
    expect(saved).toContain("Can you tell me whether a telehealth appointment is available?");
    expect(saved.some((q) => /^would you like to/i.test(q))).toBe(false);
    expect(within(barrier).getByRole("button", { name: /added to my questions/i })).toBeDisabled();
  });

  it("persists a status change", async () => {
    const { patientId } = activeFixture();
    act(() => useDemoStore.getState().upsertActions(patientId, [verifiedCareItem()]));
    renderView();
    await hydrated();

    const card = await screen.findByTestId("action-card");
    await userEvent.click(within(card).getByRole("radio", { name: /completed/i }));

    const stored = useDemoStore.getState().patients[patientId].actions.find((a) => a.id === "act-test-care");
    expect(stored?.status).toBe("completed");
    const persisted = JSON.parse(window.localStorage.getItem(DEMO_STORE_KEY) ?? "{}");
    const persistedItem = persisted.state.patients[patientId].actions.find((a: ActionItem) => a.id === "act-test-care");
    expect(persistedItem.status).toBe("completed");

    cleanup();
    renderView();
    const again = await screen.findByTestId("action-card");
    expect(within(again).getByRole("radio", { name: /completed/i })).toBeChecked();
    expect(again).toHaveAttribute("data-status", "completed");
  });

  it("shows the exact source passage for verified items", async () => {
    const { patientId } = activeFixture();
    const care = verifiedCareItem();
    act(() => useDemoStore.getState().upsertActions(patientId, [care]));
    renderView();
    await hydrated();
    await userEvent.click(await screen.findByRole("button", { name: /view source/i }));
    const viewer = await screen.findByTestId("source-viewer");
    expect(within(viewer).getByTestId("source-viewer-highlight")).toHaveTextContent(care.sourceRef!.quote);
    expect(within(viewer).getByText("Fictional documented step")).toBeInTheDocument();
  });

  it("adds a patient-selected goal and a question", async () => {
    const { patientId } = activeFixture();
    act(() => useDemoStore.getState().upsertActions(patientId, [verifiedCareItem()]));
    renderView();
    await hydrated();
    await userEvent.type(await screen.findByLabelText(/add a wellness goal/i), "Walk after dinner");
    await userEvent.click(within(screen.getByTestId("section-wellness_goal")).getByRole("button", { name: /^add$/i }));
    await userEvent.type(screen.getByLabelText(/^add a question/i), "What do my results mean?");
    await userEvent.click(within(screen.getByTestId("section-provider_question")).getByRole("button", { name: /^add$/i }));

    const actions = useDemoStore.getState().patients[patientId].actions;
    expect(actions.find((a) => a.description === "Walk after dinner")).toMatchObject({
      origin: "patient_selected",
      category: "wellness_goal",
    });
    expect(actions.find((a) => a.description === "What do my results mean?")).toMatchObject({
      origin: "patient_selected",
      category: "provider_question",
    });
    expect(screen.getByTestId("count-wellness_goal")).toHaveTextContent("1");
  });

  it("rebuilds from the summary via POST /api/action-plan and shows errors with retry", async () => {
    const { patientId } = activeFixture();
    act(() => useDemoStore.getState().upsertActions(patientId, [verifiedCareItem()]));
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 500 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ actions: [verifiedCareItem(), barrierItem()] }), { status: 200 }),
      );
    renderView(fetchImpl as unknown as typeof fetch);
    await hydrated();

    await userEvent.click(await screen.findByRole("button", { name: /rebuild from my summary/i }));
    expect(await screen.findByText(/couldn't rebuild/i)).toBeInTheDocument();
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/action-plan");
    expect(JSON.parse(String(init.body))).toMatchObject({ patientId, existing: [{ id: "act-test-care" }] });

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(await screen.findByTestId("barrier-suggestions")).toBeInTheDocument();
    expect(useDemoStore.getState().patients[patientId].actions.map((a) => a.id)).toContain("act-test-barrier");
  });

  it("sets an in-app reminder", async () => {
    const { patientId } = activeFixture();
    act(() => useDemoStore.getState().upsertActions(patientId, [verifiedCareItem()]));
    renderView();
    await hydrated();
    await userEvent.click(await screen.findByRole("button", { name: /add a reminder/i }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/in this app only/i)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: /save reminder/i }));
    const stored = useDemoStore.getState().patients[patientId].actions[0];
    expect(stored.reminder).toMatchObject({ dismissed: false, label: "Fictional documented step" });
    expect(await screen.findByTestId("reminder-chip")).toBeInTheDocument();
  });
  it("shows one in-app toast for reminders due within 24 hours", async () => {
    const { patientId } = activeFixture();
    const soon = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const later = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
    act(() =>
      useDemoStore.getState().upsertActions(patientId, [
        { ...verifiedCareItem(), reminder: { at: soon, label: "Call the clinic", dismissed: false } },
        { ...barrierItem(), reminder: { at: later, label: "Ask about rides", dismissed: false } },
      ]),
    );
    renderView();
    await hydrated();
    expect(await screen.findByText("Reminder: Call the clinic")).toBeInTheDocument();
    expect(screen.queryByText("Reminder: Ask about rides")).toBeNull();
  });
});
