import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionItem } from "@/lib/types";
import { exactRef } from "@/data/patients";
import { ToastProvider } from "@/components/ui";
import { useDemoStore } from "@/lib/store";
import { FollowUpView } from "./FollowUpView";

vi.mock("next/navigation", () => ({ usePathname: () => "/follow-up", useRouter: () => ({ push: vi.fn() }) }));

const NOW = "2026-11-07T12:00:00.000Z";

function seedActiveState() {
  const store = useDemoStore.getState();
  store.resetDemo();
  const s = useDemoStore.getState();
  const session = s.patients[s.activePatientId]!;
  const id = session.profile.id;
  const doc = session.documents[0]!;
  // First line of the fixture document's text that is long enough to quote uniquely.
  const quote = doc.text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 20 && doc.text.indexOf(l) === doc.text.lastIndexOf(l))!;
  const base = { patientId: id, rationale: "test", createdAt: NOW, updatedAt: NOW } as const;
  const actions: ActionItem[] = [
    {
      ...base,
      id: "act-doc",
      documentId: doc.id,
      description: "Documented step from the visit summary",
      type: "other",
      category: "care_plan",
      origin: "clinician_documented",
      sourceRef: exactRef(doc, quote),
      sourceVerification: "verified",
      status: "pending",
    },
    {
      ...base,
      id: "act-ai-q",
      description: "Could I ask whether a telehealth visit is available?",
      type: "question_for_provider",
      category: "provider_question",
      origin: "ai_suggested",
      sourceVerification: "not_applicable",
      status: "pending",
    },
  ];
  store.upsertActions(id, actions);
  store.addSavedQuestion(id, "What does my test result mean?");
  return { id, quote, profile: session.profile };
}

function renderView() {
  return render(
    <ToastProvider>
      <FollowUpView />
    </ToastProvider>,
  );
}

describe("FollowUpView", () => {
  beforeEach(() => {
    useDemoStore.getState().resetDemo();
  });

  it("shows labeled sections, a prefilled editable summary and saves edits", async () => {
    const { id, quote } = seedActiveState();
    renderView();

    const textarea = (await screen.findByLabelText("Summary text")) as HTMLTextAreaElement;
    expect(textarea.value).toContain("What does my test result mean?");
    expect(textarea.value).toContain("Documented step from the visit summary");
    expect(textarea.value).toContain("Demonstration using fictional patient data.");

    // Origin labels: saved question → patient, AI question → Kat, documented step → clinician.
    const questions = screen.getByRole("heading", { name: "My questions" }).parentElement!;
    expect(within(questions).getByText("Chosen by you")).toBeInTheDocument();
    expect(within(questions).getByText("Suggested by Kat")).toBeInTheDocument();
    const instructions = screen.getByRole("heading", { name: "Instructions from my visit summary" }).parentElement!;
    expect(within(instructions).getByText("From your clinician")).toBeInTheDocument();
    expect(within(instructions).getByTestId("source-highlight")).toHaveTextContent(quote);
    expect(screen.getByTestId("follow-up-save-state")).toHaveTextContent("Draft — not saved yet");

    fireEvent.change(textarea, { target: { value: "My edited summary" } });
    fireEvent.click(screen.getByRole("button", { name: "Save summary" }));
    expect(useDemoStore.getState().patients[id]!.communicationSummary?.text).toBe("My edited summary");
    expect(screen.getByTestId("follow-up-save-state")).toHaveTextContent("Summary saved.");

    fireEvent.click(screen.getByRole("button", { name: "Update my summary" }));
    expect(textarea.value).toContain("Documented step from the visit summary");
    expect(screen.getByTestId("follow-up-save-state")).toHaveTextContent("You have unsaved changes.");
  });

  it("copies the summary to the clipboard", async () => {
    seedActiveState();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    renderView();
    const textarea = (await screen.findByLabelText("Summary text")) as HTMLTextAreaElement;
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy summary" }));
    });
    expect(writeText).toHaveBeenCalledWith(textarea.value);
    expect(await screen.findByText("Summary copied.")).toBeInTheDocument();
  });

  it("'sends' only to the simulated queue and says nothing is transmitted", async () => {
    const { id } = seedActiveState();
    renderView();
    await screen.findByLabelText("Summary text");
    fireEvent.click(screen.getByRole("button", { name: "Send to my care team (simulated)" }));

    const reqs = useDemoStore.getState().patients[id]!.careTeamRequests;
    expect(reqs).toHaveLength(1);
    expect(reqs[0]).toMatchObject({ type: "clarification", status: "submitted", simulated: true });
    const notice = screen.getByTestId("follow-up-sent");
    expect(notice).toHaveTextContent("Fictional simulation — nothing is transmitted");
    expect(notice).toHaveTextContent("Nothing is sent to a real care team");
    expect(document.body.textContent).not.toMatch(/delivered/i);
  });

  it("request form validates, adds a typed request with a related action, and flags urgent text", async () => {
    const { id } = seedActiveState();
    renderView();
    const form = await screen.findByRole("form", { name: "Ask my care team something (simulated)" });

    fireEvent.click(within(form).getByRole("button", { name: "Add to simulated queue" }));
    expect(within(form).getByText("Please write a short summary.")).toBeInTheDocument();
    expect(useDemoStore.getState().patients[id]!.careTeamRequests).toHaveLength(0);

    fireEvent.change(within(form).getByLabelText("Request type"), { target: { value: "refill_request" } });
    expect(within(form).getByText(/never authorizes refills/)).toBeInTheDocument();
    fireEvent.change(within(form).getByLabelText(/What would you like to ask/), {
      target: { value: "Please review a refill for my current medicine." },
    });
    fireEvent.change(within(form).getByLabelText("Related item from my plan"), { target: { value: "act-doc" } });
    fireEvent.click(within(form).getByRole("button", { name: "Add to simulated queue" }));

    await waitFor(() => expect(useDemoStore.getState().patients[id]!.careTeamRequests).toHaveLength(1));
    expect(useDemoStore.getState().patients[id]!.careTeamRequests[0]).toMatchObject({
      type: "refill_request",
      relatedActionId: "act-doc",
      simulated: true,
    });
    expect(within(form).queryByTestId("follow-up-safety")).toBeNull();

    fireEvent.change(within(form).getByLabelText(/What would you like to ask/), {
      target: { value: "I have crushing chest pain and my left arm is numb" },
    });
    fireEvent.click(within(form).getByRole("button", { name: "Add to simulated queue" }));
    const safety = within(form).getByTestId("follow-up-safety");
    expect(safety).toHaveTextContent("This simulated queue is not monitored");
    expect(safety).toHaveTextContent(/911/);
  });
});
