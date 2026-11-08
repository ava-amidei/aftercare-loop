import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PATIENT_ID, patients as fixturePatients } from "@/data/patients";
import type { ActionItem, ChatMessage, DocumentInterpretation } from "@/lib/types";
import { useDemoStore } from "@/lib/store/demo-store";
import { Dashboard } from "./Dashboard";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const NOW = new Date(2026, 10, 7, 9, 0, 0);

const userMsg = (id: string, content: string): ChatMessage => ({
  id,
  role: "user",
  content,
  createdAt: "2026-11-07T08:00:00.000Z",
});

function verifiedAction(patientId: string, patch: Partial<ActionItem> = {}): ActionItem {
  const doc = useDemoStore.getState().patients[patientId].documents[0];
  const start = 0;
  const end = Math.min(40, doc.text.length);
  return {
    id: `act-${patientId}-1`,
    patientId,
    documentId: doc.id,
    description: "Fictional documented follow-up step",
    type: "appointment",
    category: "care_plan",
    origin: "clinician_documented",
    sourceRef: { documentId: doc.id, start, end, quote: doc.text.slice(start, end) },
    sourceVerification: "verified",
    status: "pending",
    rationale: "Documented in the fictional visit summary",
    dueDate: "2026-11-20",
    createdAt: "2026-11-07T08:00:00.000Z",
    updatedAt: "2026-11-07T08:00:00.000Z",
    ...patch,
  };
}

beforeAll(async () => {
  await useDemoStore.persist.rehydrate();
});

beforeEach(() => {
  globalThis.localStorage?.clear?.();
  act(() => useDemoStore.getState().resetDemo());
});

describe("Dashboard", () => {
  it("greets the active fictional patient with scenario, topics and the start nudge", async () => {
    const profile = fixturePatients.find((p) => p.id === DEFAULT_PATIENT_ID)!;
    render(<Dashboard now={NOW} />);
    expect(await screen.findByRole("heading", { level: 1 })).toHaveTextContent(profile.displayName);
    expect(screen.getByTestId("scenario-summary")).toHaveTextContent(profile.scenarioSummary);
    const topics = screen.getByTestId("dashboard-topics");
    for (const c of profile.conditions) expect(within(topics).getByText(c)).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-start-nudge")).toHaveTextContent(
      "Start by understanding your visit summary",
    );
    // Four primary actions.
    expect(screen.getByRole("link", { name: /Understand My Health/ })).toHaveAttribute("href", "/understand");
    expect(screen.getByRole("link", { name: /My Action Plan/ })).toHaveAttribute("href", "/action-plan");
    expect(screen.getByRole("link", { name: /Prepare for My Appointment/ })).toHaveAttribute("href", "/follow-up");
    expect(screen.getByRole("button", { name: /Ask a question and prepare/ })).toBeInTheDocument();
  });

  it("opens Ask Kat from the big button", async () => {
    const user = userEvent.setup();
    render(<Dashboard now={NOW} />);
    const [big] = await screen.findAllByRole("button", { name: "Ask Kat" });
    await user.click(big);
    expect(useDemoStore.getState().katOpen).toBe(true);
  });

  it("shows pending clinician tasks with origin badge, due date and a working View source", async () => {
    const user = userEvent.setup();
    const pid = useDemoStore.getState().activePatientId;
    act(() =>
      useDemoStore.getState().upsertActions(pid, [
        verifiedAction(pid),
        verifiedAction(pid, {
          id: "ai-1",
          origin: "ai_suggested",
          type: "administrative",
          sourceRef: undefined,
          sourceVerification: "not_applicable",
          description: "Ask the clinic about telehealth options?",
        }),
      ]),
    );
    render(<Dashboard now={NOW} />);
    const section = await screen.findByTestId("dashboard-care-team");
    const tasks = within(section).getAllByTestId("care-team-task");
    expect(tasks).toHaveLength(1); // the AI suggestion is never listed as a care-team instruction
    expect(tasks[0].querySelector('[data-origin="clinician_documented"]')).not.toBeNull();
    expect(tasks[0]).toHaveTextContent("Due Nov 20, 2026");
    await user.click(within(tasks[0]).getByRole("button", { name: "View source" }));
    expect(within(tasks[0]).getByTestId("source-highlight")).toBeInTheDocument();
    expect(within(tasks[0]).getByText("Matches the text of your summary")).toBeInTheDocument();

    // Upcoming lists both due-dated items, each labelled by origin.
    const upcoming = screen.getAllByTestId("upcoming-item");
    expect(upcoming).toHaveLength(2);
    expect(upcoming[1].querySelector('[data-origin="ai_suggested"]')).not.toBeNull();
  });

  it("isolates recent questions per patient when switching", async () => {
    const st = useDemoStore.getState();
    const [a, b] = Object.keys(st.patients);
    act(() => {
      st.switchPatient(a);
      st.appendChat(a, userMsg("m1", "Question only patient A asked"));
      st.addSavedQuestion(a, "Saved by patient A");
    });
    render(<Dashboard now={NOW} />);
    expect(await screen.findByText("Question only patient A asked")).toBeInTheDocument();
    expect(screen.getByText("Saved by patient A")).toBeInTheDocument();

    act(() => useDemoStore.getState().switchPatient(b));
    const profileB = useDemoStore.getState().patients[b].profile;
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(profileB.displayName);
    expect(screen.queryByText("Question only patient A asked")).not.toBeInTheDocument();
    expect(screen.queryByText("Saved by patient A")).not.toBeInTheDocument();
    expect(screen.getByTestId("dashboard")).toHaveAttribute("data-patient-id", b);
  });

  it("shows the interpretation mode badge and hides the nudge once interpreted", async () => {
    const pid = useDemoStore.getState().activePatientId;
    const doc = useDemoStore.getState().patients[pid].documents[0];
    const interp = {
      documentId: doc.id,
      patientId: pid,
      whatThisMeans: "",
      terms: [],
      whatToKnow: [],
      discussWithProvider: [],
      instructions: [],
      unansweredQuestions: [],
      limitations: [],
      safetyFlags: [],
      referenceIds: [],
      meta: { mode: "scripted_demo", generatedAt: "2026-11-07T08:00:00.000Z", disclaimer: "" },
    } satisfies DocumentInterpretation;
    act(() => useDemoStore.getState().setInterpretation(pid, interp));
    render(<Dashboard now={NOW} />);
    const card = await screen.findByTestId("dashboard-document");
    expect(within(card).getByText("Reviewed")).toBeInTheDocument();
    expect(card.querySelector('[data-mode="scripted_demo"]')).not.toBeNull();
    expect(screen.queryByTestId("dashboard-start-nudge")).not.toBeInTheDocument();
    expect(screen.getByTestId("dashboard-care-team")).toHaveTextContent(
      "No pending steps from your care team right now.",
    );
  });

  it("renders in Spanish for a Spanish-preferring patient", async () => {
    const es = Object.values(useDemoStore.getState().patients).find((p) => p.profile.language === "es");
    expect(es).toBeDefined();
    act(() => useDemoStore.getState().switchPatient(es!.profile.id));
    render(<Dashboard now={NOW} />);
    expect(await screen.findByText("Mi panel de salud")).toBeInTheDocument();
    expect(screen.getByText("Comience por entender el resumen de su consulta")).toBeInTheDocument();
  });
});
