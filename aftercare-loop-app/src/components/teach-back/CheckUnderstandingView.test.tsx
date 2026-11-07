import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TeachBackQuestion, TeachBackSession } from "@/lib/types";
import { ToastProvider } from "@/components/ui";
import { useDemoStore } from "@/lib/store";
import { getGroundTruth } from "@/data/ground-truth";
import { CheckUnderstandingView } from "./CheckUnderstandingView";
import type { TeachBackRequestBody } from "./teach-back-logic";

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

const AT = "2026-11-07T12:00:00.000Z";
const CLARIFICATION = "Let me explain that another way. Your visit summary says the fictional step happens later.";

function activeQuestions(): { patientId: string; questions: TeachBackQuestion[] } {
  const s = useDemoStore.getState();
  const session = s.patients[s.activePatientId];
  const gt = getGroundTruth(s.activePatientId)!;
  return {
    patientId: s.activePatientId,
    questions: gt.teachBackQuestions.filter((q) => q.documentId === session.activeDocumentId),
  };
}

/**
 * Fake /api/teach-back: answers containing "WRONG" are scored not-yet-correct
 * (with a scripted clarification); anything else is correct. The real scoring
 * lives server-side and is covered by the teach-back service tests.
 */
function fakeTeachBackApi() {
  return vi.fn(async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as TeachBackRequestBody;
    const prev: TeachBackSession = body.session ?? {
      questionId: body.questionId,
      patientId: body.patientId,
      attempts: [],
      clarificationProvided: false,
      savedForClinician: false,
      completed: false,
    };
    const correct = !body.response.includes("WRONG");
    const attemptNumber = prev.attempts.length + 1;
    const session: TeachBackSession = {
      ...prev,
      attempts: [
        ...prev.attempts,
        {
          attemptNumber,
          response: body.response,
          matchedConcepts: [],
          correct,
          at: AT,
          ...(correct ? {} : { clarification: CLARIFICATION, clarificationMode: "scripted_demo" as const }),
        },
      ],
      initialCorrect: prev.initialCorrect ?? correct,
      finalCorrect: correct,
      clarificationProvided: prev.clarificationProvided || !correct,
      completed: correct,
    };
    return new Response(
      JSON.stringify({
        session,
        ...(correct ? {} : { clarification: CLARIFICATION, clarificationMode: "scripted_demo" }),
      }),
      { status: 200 },
    );
  });
}

const renderView = (props: { initialQuestionId?: string; fetchImpl?: typeof fetch } = {}) =>
  render(
    <ToastProvider>
      <CheckUnderstandingView {...props} />
    </ToastProvider>,
  );

beforeEach(() => {
  act(() => useDemoStore.getState().resetDemo());
});
afterEach(() => cleanup());

describe("CheckUnderstandingView", () => {
  it("has fixture questions for the default patient's active document", () => {
    expect(activeQuestions().questions.length).toBeGreaterThanOrEqual(2);
  });

  it("wrong answer → clarification with mode badge → retry → correct, persisted on every attempt", async () => {
    const { patientId, questions } = activeQuestions();
    const q = questions[0];
    const fetchImpl = fakeTeachBackApi();
    renderView({ fetchImpl: fetchImpl as unknown as typeof fetch });

    expect(await screen.findByText("Let's make sure I explained that clearly.")).toBeInTheDocument();
    expect(screen.getByTestId("check-progress")).toHaveTextContent(`Question 1 of ${questions.length}`);
    expect(screen.getByRole("heading", { level: 2, name: q.prompt })).toBeInTheDocument();
    expect(screen.getByTestId("source-highlight")).toHaveTextContent(q.sourceRef.quote);

    // Attempt 1: free text that the fake API scores as not yet correct.
    await userEvent.type(screen.getByRole("textbox"), "WRONG idea");
    await userEvent.click(screen.getByRole("button", { name: /check my answer/i }));

    const clarification = await screen.findByTestId("clarification");
    expect(within(clarification).getByText("Let me explain that another way.")).toBeInTheDocument();
    expect(within(clarification).getByText(/the fictional step happens later/)).toBeInTheDocument();
    expect(within(clarification).getByText("Scripted Demo Mode")).toBeInTheDocument();
    expect(screen.queryByText(/fail/i)).toBeNull();

    let stored = useDemoStore.getState().patients[patientId].teachBack[q.id];
    expect(stored.attempts).toHaveLength(1);
    expect(stored.initialCorrect).toBe(false);

    // Retry: choose the correct multiple-choice option (or type, if none).
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    const right = q.choices?.find((c) => c.correct);
    if (right) await userEvent.click(screen.getByRole("radio", { name: right.text }));
    else await userEvent.type(screen.getByRole("textbox"), q.expectedAnswer);
    await userEvent.click(screen.getByRole("button", { name: /check my answer/i }));

    expect(await screen.findByText("That's it. Thanks for working through it with me.")).toBeInTheDocument();
    stored = useDemoStore.getState().patients[patientId].teachBack[q.id];
    expect(stored.attempts).toHaveLength(2);
    expect(stored).toMatchObject({ initialCorrect: false, finalCorrect: true, completed: true });
    const secondBody = JSON.parse(String((fetchImpl.mock.calls[1] as unknown as [string, RequestInit])[1].body));
    expect(secondBody.session.attempts).toHaveLength(1);
    if (right) expect(secondBody.response).toBe(right.text);

    await userEvent.click(screen.getByRole("button", { name: /next question/i }));
    expect(screen.getByTestId("check-progress")).toHaveTextContent(`Question 2 of ${questions.length}`);
  });

  it("supports ?questionId= deep links, saving for the care team, and an end summary", async () => {
    const { patientId, questions } = activeQuestions();
    const last = questions[questions.length - 1];
    renderView({ initialQuestionId: last.id, fetchImpl: fakeTeachBackApi() as unknown as typeof fetch });

    expect(await screen.findByRole("heading", { level: 2, name: last.prompt })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /save this question for my care team/i }));
    const state = useDemoStore.getState().patients[patientId];
    expect(state.savedQuestions).toContain(last.prompt);
    expect(state.teachBack[last.id].savedForClinician).toBe(true);

    await userEvent.type(screen.getByRole("textbox"), "my own words");
    await userEvent.click(screen.getByRole("button", { name: /check my answer/i }));
    await userEvent.click(await screen.findByRole("button", { name: /see my summary/i }));

    const summary = await screen.findByTestId("teach-back-summary");
    expect(within(summary).getByText(`1 of ${questions.length} clear on the first try`)).toBeInTheDocument();
    expect(within(summary).getByText(`1 of ${questions.length} clear by the end`)).toBeInTheDocument();
    expect(within(summary).queryByText(/fail/i)).toBeNull();
  });

  it("shows an error with retry when the check request fails", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 500 }))
      .mockImplementation(fakeTeachBackApi());
    renderView({ fetchImpl: fetchImpl as unknown as typeof fetch });
    await userEvent.type(await screen.findByRole("textbox"), "my answer");
    await userEvent.click(screen.getByRole("button", { name: /check my answer/i }));
    expect(await screen.findByText("We couldn't check your answer right now.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^try again$/i }));
    await waitFor(() => expect(screen.getByText("That's right.")).toBeInTheDocument());
  });

  it("shows an empty state when the active document has no questions", async () => {
    const { patientId } = activeQuestions();
    act(() =>
      useDemoStore.getState().addDocument(patientId, {
        id: "doc-pasted-test",
        patientId,
        title: "Pasted fictional note",
        text: "Fictional text.",
        createdAt: AT,
        source: "pasted",
      }),
    );
    renderView();
    expect(await screen.findByText("No questions yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to understand my health/i })).toHaveAttribute("href", "/understand");
  });
  it("works end-to-end against the real /api/teach-back handler (scripted mode)", async () => {
    process.env.AFTERCARE_FORCE_SCRIPTED = "true";
    const { POST } = await import("@/app/api/teach-back/route");
    const fetchImpl = ((url: string, init: RequestInit) =>
      POST(new Request(`http://localhost${url}`, init))) as unknown as typeof fetch;
    const { patientId, questions } = activeQuestions();
    const q = questions.find((x) => x.choices?.some((c) => !c.correct))!;
    renderView({ initialQuestionId: q.id, fetchImpl });

    const wrong = q.choices!.find((c) => !c.correct)!;
    const right = q.choices!.find((c) => c.correct)!;
    await userEvent.click(await screen.findByRole("radio", { name: wrong.text }));
    await userEvent.click(screen.getByRole("button", { name: /check my answer/i }));
    const clarification = await screen.findByTestId("clarification");
    expect(within(clarification).getByText("Let me explain that another way.")).toBeInTheDocument();
    expect(clarification.querySelector("[data-mode]")).not.toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /try again/i }));
    await userEvent.click(screen.getByRole("radio", { name: right.text }));
    await userEvent.click(screen.getByRole("button", { name: /check my answer/i }));
    expect(await screen.findByText("That's it. Thanks for working through it with me.")).toBeInTheDocument();
    expect(useDemoStore.getState().patients[patientId].teachBack[q.id]).toMatchObject({
      initialCorrect: false,
      finalCorrect: true,
      clarificationProvided: true,
    });
  });
});
