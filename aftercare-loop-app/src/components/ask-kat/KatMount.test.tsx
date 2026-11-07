import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ActionItem, ChatMessage, KatResponse, SafetyVerdict } from "@/lib/types";
import { ToastProvider } from "@/components/ui";
import { useDemoStore } from "@/lib/store";
import { patients } from "@/data/patients";
import { KatMount } from "./KatMount";
import { useKatRuntime } from "./use-kat-chat";

const nav = vi.hoisted(() => ({ pathname: "/", push: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: nav.push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
}));
// Sibling component: keep this test independent of its internals.
vi.mock("@/components/understand/SourceViewer", () => ({
  SourceViewer: ({ open, sourceRef }: { open: boolean; sourceRef: { quote: string } }) =>
    open ? <div data-testid="source-viewer">{sourceRef.quote}</div> : null,
}));

const WELCOME =
  "Hi! I'm Kat. 💗\nI'm here to help you understand your health information, explore reliable resources, and prepare questions for your care team.\nWhat's on your mind today?";

const NONE: SafetyVerdict = { level: "none", detectedBy: "none" };

function reply(partial: Partial<ChatMessage> = {}, safety: SafetyVerdict = NONE): KatResponse {
  return {
    safety,
    message: {
      id: `msg-${Math.random().toString(36).slice(2)}`,
      role: "assistant",
      content: "Here is what your document says.",
      createdAt: new Date().toISOString(),
      referenceIds: [],
      sourceRefs: [],
      actions: [],
      safety,
      meta: {
        mode: "scripted_demo",
        generatedAt: new Date().toISOString(),
        disclaimer: "",
        generatedBy: "scripted",
      },
      ...partial,
    },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const pid = () => useDemoStore.getState().activePatientId;
const chat = () => useDemoStore.getState().patients[pid()]!.chat;

function renderKat(fetchImpl: typeof fetch) {
  return render(
    <ToastProvider>
      <KatMount fetchImpl={fetchImpl} />
    </ToastProvider>,
  );
}

async function openPanel() {
  const fab = await screen.findByRole("button", { name: /open ask kat/i });
  fireEvent.click(fab);
  return screen.findByRole("dialog");
}

beforeEach(() => {
  globalThis.localStorage?.clear?.();
  nav.pathname = "/";
  nav.push.mockReset();
  act(() => {
    useDemoStore.getState().resetDemo();
    useKatRuntime.getState().reset();
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Ask Kat", () => {
  it("shows the exact welcome message and five chips on first open, once per patient", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    renderKat(fetchMock);
    const dialog = await openPanel();

    expect(within(dialog).getByRole("heading", { name: "Ask Kat" })).toBeInTheDocument();
    const welcome = within(dialog).getByText((_, el) => el?.tagName === "P" && el.textContent === WELCOME);
    expect(welcome).toBeInTheDocument();

    const chips = within(within(dialog).getByTestId("kat-welcome-chips")).getAllByRole("button");
    expect(chips.map((c) => c.textContent)).toEqual([
      "What should I ask my doctor?",
      "Explain my diagnosis",
      "Help me understand my results",
      "Help me plan my next steps",
      "Ask Kat anything about your health…",
    ]);
    expect(useDemoStore.getState().katHasOpenedOnce[pid()]).toBe(true);
    expect(chat()).toHaveLength(1);

    // "Ask Kat anything…" focuses the input (no request).
    fireEvent.click(chips[4]!);
    expect(within(dialog).getByLabelText("Message Kat")).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();

    // Close and reopen: history kept, no second welcome.
    fireEvent.click(within(dialog).getByRole("button", { name: "Close Ask Kat" }));
    await openPanel();
    expect(chat()).toHaveLength(1);
  });

  it("keeps focus in the panel after a welcome chip is sent, so Escape still closes it", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(reply({ content: "Chip reply" })));
    renderKat(fetchMock);
    const dialog = await openPanel();
    const chip = within(within(dialog).getByTestId("kat-welcome-chips")).getByRole("button", {
      name: "What should I ask my doctor?",
    });
    chip.focus();
    fireEvent.click(chip);
    expect(await within(dialog).findByText("Chip reply")).toBeInTheDocument();
    expect(within(dialog).queryByTestId("kat-welcome-chips")).not.toBeInTheDocument();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("sending a message appends both turns to the active patient's store and sends context", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(reply({ referenceIds: ["does-not-exist"], content: "Kat reply text" })),
    );
    renderKat(fetchMock);
    const dialog = await openPanel();

    fireEvent.change(within(dialog).getByLabelText("Message Kat"), { target: { value: "What is this test?" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Send" }));

    expect(await within(dialog).findByText("Kat reply text")).toBeInTheDocument();
    const roles = chat().map((m) => [m.role, m.content]);
    expect(roles.slice(1)).toEqual([
      ["user", "What is this test?"],
      ["assistant", "Kat reply text"],
    ]);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/ask-kat");
    const body = JSON.parse(String(init!.body));
    expect(body.patientId).toBe(pid());
    expect(body.message).toBe("What is this test?");
    expect(body.history).toEqual([]); // welcome is not sent as history
    expect(body.context.documentId).toBe(useDemoStore.getState().patients[pid()]!.activeDocumentId);
    expect(body.context).toHaveProperty("actions");
    expect(body.context).toHaveProperty("savedQuestions");

    // Unknown reference ids are never rendered as sources; scripted mode banner + badge shown.
    expect(within(dialog).queryByText("Sources")).not.toBeInTheDocument();
    expect(within(dialog).getByTestId("kat-scripted-banner")).toHaveTextContent(
      "Scripted Demo Mode — Responses are predefined for demonstration purposes.",
    );
  });

  it("renders an emergency verdict as a danger alert with guidance and nothing else", async () => {
    const guidance = "This could be a medical emergency. Call 911 (or your local emergency number) now.";
    const verdict: SafetyVerdict = {
      level: "emergency",
      scenario: "chest_pain",
      detectedBy: "rules",
      guidance,
    };
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        reply(
          {
            content: guidance,
            // Even if extra content slipped through, it must not render.
            actions: [{ kind: "view_action_plan", label: "View my action plan" }],
            meta: { mode: "scripted_demo", generatedAt: "", disclaimer: "", generatedBy: "deterministic" },
          },
          verdict,
        ),
      ),
    );
    renderKat(fetchMock);
    const dialog = await openPanel();
    fireEvent.change(within(dialog).getByLabelText("Message Kat"), {
      target: { value: "crushing chest pain and my arm is numb" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Send" }));

    const alert = await within(dialog).findByTestId("kat-emergency");
    expect(alert).toHaveAttribute("role", "alert");
    expect(alert).toHaveAttribute("data-variant", "danger");
    expect(alert).toHaveTextContent("This may be an emergency");
    expect(alert).toHaveTextContent(guidance);
    expect(within(dialog).queryByRole("button", { name: "View my action plan" })).not.toBeInTheDocument();
    expect(within(alert).queryByText(/Scripted Demo Mode/)).not.toBeInTheDocument();
  });

  it("shows an error bubble with Retry that resends without duplicating the user message", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ error: "Something went wrong on our side. Please try again." }, 500))
      .mockResolvedValueOnce(jsonResponse(reply({ content: "Second try worked" })));
    renderKat(fetchMock);
    const dialog = await openPanel();
    fireEvent.change(within(dialog).getByLabelText("Message Kat"), { target: { value: "Hello" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Send" }));

    const error = await within(dialog).findByTestId("kat-error");
    expect(error).toHaveTextContent("Kat couldn't respond just now.");
    fireEvent.click(within(error).getByRole("button", { name: "Try again" }));
    expect(await within(dialog).findByText("Second try worked")).toBeInTheDocument();
    expect(chat().filter((m) => m.role === "user")).toHaveLength(1);
    expect(within(dialog).queryByTestId("kat-error")).not.toBeInTheDocument();
  });

  it("plan_next_steps builds the action plan first when none exists and offers View my action plan", async () => {
    const id = pid();
    const docId = useDemoStore.getState().patients[id]!.activeDocumentId!;
    const action: ActionItem = {
      id: "act-1",
      patientId: id,
      documentId: docId,
      description: "Fictional documented step",
      type: "appointment",
      category: "care_plan",
      origin: "clinician_documented",
      sourceVerification: "verified",
      status: "pending",
      rationale: "Documented",
      createdAt: "",
      updatedAt: "",
    };
    const fetchMock = vi.fn<typeof fetch>(async (url) =>
      String(url) === "/api/action-plan"
        ? jsonResponse({ actions: [action] })
        : jsonResponse(reply({ content: "Your next steps", quickPrompt: "plan_next_steps" })),
    );
    renderKat(fetchMock);
    const dialog = await openPanel();
    fireEvent.click(within(dialog).getByRole("button", { name: "Help me plan my next steps" }));

    const btn = await within(dialog).findByRole("button", { name: /View my action plan/ });
    expect(fetchMock.mock.calls.map((c) => String(c[0]))).toEqual(["/api/action-plan", "/api/ask-kat"]);
    const askBody = JSON.parse(String(fetchMock.mock.calls[1]![1]!.body));
    expect(askBody.quickPrompt).toBe("plan_next_steps");
    expect(askBody.context.actions).toHaveLength(1);
    expect(useDemoStore.getState().patients[id]!.actions).toHaveLength(1);

    fireEvent.click(btn);
    expect(nav.push).toHaveBeenCalledWith("/action-plan");
    expect(useDemoStore.getState().katOpen).toBe(false);
  });

  it("contextual actions: add question (AI-suggested), view source, check understanding", async () => {
    const id = pid();
    const doc = useDemoStore.getState().patients[id]!.documents[0]!;
    const quote = doc.text.slice(0, 20);
    const sourceRef = { documentId: doc.id, start: 0, end: 20, quote };
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        reply({
          sourceRefs: [sourceRef],
          actions: [
            { kind: "view_source", label: "View original source", payload: { sourceRef } },
            { kind: "add_question", label: "Add question to my list", payload: { question: "What should I bring?" } },
            { kind: "check_understanding", label: "Check my understanding", payload: { questionIds: ["tb-1"] } },
          ],
        }),
      ),
    );
    renderKat(fetchMock);
    const dialog = await openPanel();
    fireEvent.click(within(dialog).getByRole("button", { name: "What should I ask my doctor?" }));
    await within(dialog).findByText("Here is what your document says.");

    // Clinician quote vs AI-suggested question are labeled distinctly.
    expect(dialog.querySelector('[data-origin="clinician_documented"]')).not.toBeNull();
    expect(dialog.querySelector('[data-origin="ai_suggested"]')).not.toBeNull();
    // The view_source action duplicates the listed sourceRef, so only one button.
    const viewButtons = within(dialog).getAllByRole("button", { name: /View source|View original source/ });
    expect(viewButtons).toHaveLength(1);
    fireEvent.click(viewButtons[0]!);
    expect(screen.getByTestId("source-viewer").textContent).toBe(quote);

    fireEvent.click(within(dialog).getByRole("button", { name: "Add question to my list" }));
    expect(useDemoStore.getState().patients[id]!.savedQuestions).toContain("What should I bring?");
    expect(await screen.findByText("Added to your questions.")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "In your questions" })).toBeDisabled();

    fireEvent.click(within(dialog).getByRole("button", { name: /Check my understanding/ }));
    expect(nav.push).toHaveBeenCalledWith("/check?questionId=tb-1");
  });

  it("keeps chat per patient when switching", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(reply({ content: "Reply for A" })));
    renderKat(fetchMock);
    const dialog = await openPanel();
    fireEvent.change(within(dialog).getByLabelText("Message Kat"), { target: { value: "Question from A" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Send" }));
    await within(dialog).findByText("Reply for A");

    const other = patients.find((p) => p.id !== pid())!;
    act(() => useDemoStore.getState().switchPatient(other.id));
    await waitFor(() => expect(within(dialog).queryByText("Question from A")).not.toBeInTheDocument());
    // The other patient gets their own first-open welcome.
    await waitFor(() => expect(useDemoStore.getState().patients[other.id]!.chat).toHaveLength(1));
    expect(useDemoStore.getState().katHasOpenedOnce[other.id]).toBe(true);
  });

  it("is hidden on /care-team and /evaluation", async () => {
    nav.pathname = "/care-team";
    const { unmount } = renderKat(vi.fn<typeof fetch>());
    await act(async () => {});
    expect(screen.queryByTestId("kat-fab")).not.toBeInTheDocument();
    unmount();
    nav.pathname = "/evaluation";
    renderKat(vi.fn<typeof fetch>());
    await act(async () => {});
    expect(screen.queryByTestId("kat-fab")).not.toBeInTheDocument();
  });
});
