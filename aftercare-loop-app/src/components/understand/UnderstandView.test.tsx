import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { references } from "@/data/evidence";
import { ToastProvider } from "@/components/ui";
import { useDemoStore } from "@/lib/store";
import type { DocumentInterpretation, VisitDocument } from "@/lib/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/understand",
}));

const { UnderstandView } = await import("./UnderstandView");

function activeDoc(): VisitDocument {
  const s = useDemoStore.getState().active();
  return s.documents.find((d) => d.id === s.activeDocumentId) ?? s.documents[0]!;
}

/** Fake interpretation built from the real fixture text: one verified + one unverified instruction. */
function fakeInterpretation(doc: VisitDocument): { interp: DocumentInterpretation; quote: string } {
  const line = doc.text.split("\n").find((l) => l.trim().length > 25)!.trim();
  const start = doc.text.indexOf(line);
  const interp: DocumentInterpretation = {
    documentId: doc.id,
    patientId: doc.patientId,
    whatThisMeans: "A plain-language overview of this fictional summary.",
    terms: [
      {
        term: "Sample term",
        definition: "A sample definition.",
        sourceRef: { documentId: doc.id, start, end: start + line.length, quote: line },
        referenceIds: [],
      },
    ],
    whatToKnow: ["General education bullet."],
    discussWithProvider: ["What should I ask at my follow-up?"],
    instructions: [
      {
        description: "Verified documented step",
        type: "appointment",
        sourceRef: { documentId: doc.id, start, end: start + line.length, quote: line },
        sourceVerification: "verified",
      },
      {
        description: "Unmatched step",
        type: "other",
        sourceVerification: "unverified",
        unverifiedQuote: "Text that is not in the document.",
      },
    ],
    unansweredQuestions: [],
    limitations: [],
    safetyFlags: [{ level: "clarify_with_clinician", message: "Please confirm this with your clinic." }],
    referenceIds: [references[0]!.id],
    meta: { mode: "scripted_demo", generatedAt: "2026-11-07T00:00:00.000Z", disclaimer: "Education only." },
  };
  return { interp, quote: line };
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function renderView() {
  return render(
    <ToastProvider>
      <UnderstandView />
    </ToastProvider>,
  );
}

beforeEach(() => {
  window.localStorage?.clear?.();
  useDemoStore.getState().resetDemo();
  push.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("UnderstandView — My visit summary", () => {
  it("prefills the fixture text, explains it, and renders the five labeled cards", async () => {
    const doc = activeDoc();
    const { interp, quote } = fakeInterpretation(doc);
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/interpret") return jsonResponse({ document: doc, interpretation: interp });
      if (url === "/api/action-plan") return jsonResponse({ actions: [] });
      return jsonResponse({ error: "unexpected" }, 500);
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderView();

    const textarea = await screen.findByLabelText("Paste your after-visit summary");
    expect(textarea).toHaveValue(doc.text);

    await user.click(screen.getByRole("button", { name: "Explain this to me" }));
    const result = await screen.findByTestId("interpretation-result");

    // fixture text unchanged → only the fixture id is sent
    const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toEqual({ patientId: doc.patientId, documentId: doc.id });
    expect(useDemoStore.getState().active().interpretations[doc.id]).toBeDefined();

    for (const title of [
      "What does this mean?",
      "What should I know?",
      "What can I discuss with my provider?",
      "What are my next steps?",
      "Sources",
    ]) {
      expect(within(result).getByRole("heading", { name: title })).toBeInTheDocument();
    }
    expect(within(result).getByText(/Scripted Demo Mode/)).toBeInTheDocument();
    expect(screen.getByTestId("safety-flags")).toHaveTextContent("Please confirm this with your clinic.");

    // Verified vs needs clarification
    const verified = screen.getByTestId("verified-instruction");
    expect(verified).toHaveTextContent("Verified documented step");
    expect(within(verified).getByText("From your clinician").closest("[data-origin]")).toHaveAttribute(
      "data-origin",
      "clinician_documented",
    );
    const unclear = screen.getByTestId("needs-clarification");
    expect(unclear).toHaveTextContent("Unmatched step");
    expect(verified).not.toHaveTextContent("Unmatched step");

    // Sources: curated, new tab
    const link = within(screen.getByTestId("card-sources")).getByRole("link");
    expect(link).toHaveAttribute("href", references[0]!.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");

    // View source → highlighted passage by offsets
    await user.click(within(verified).getByRole("button", { name: /View source/ }));
    const highlight = await screen.findByTestId("source-viewer-highlight");
    expect(highlight.textContent).toBe(quote);
    await user.click(screen.getByRole("button", { name: "Close" }));

    // Add to my questions
    await user.click(screen.getByRole("button", { name: "Add to my questions: What should I ask at my follow-up?" }));
    expect(useDemoStore.getState().active().savedQuestions).toContain("What should I ask at my follow-up?");
    expect(screen.getByRole("button", { name: /Added to your questions: What should I ask/ })).toBeDisabled();

    // CTA: check link + build plan
    expect(screen.getByRole("link", { name: "Check my understanding" })).toHaveAttribute("href", "/check");
    await user.click(screen.getByRole("button", { name: "Build my action plan" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/action-plan"));
    expect(fetchMock.mock.calls.some(([url]) => url === "/api/action-plan")).toBe(true);
  });

  it("shows an error with retry when interpretation fails", async () => {
    const doc = activeDoc();
    const { interp } = fakeInterpretation(doc);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: "Something went wrong on our side." }, 500))
      .mockResolvedValueOnce(jsonResponse({ document: doc, interpretation: interp }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderView();

    await user.click(await screen.findByRole("button", { name: "Explain this to me" }));
    expect(await screen.findByText("We couldn't create an explanation right now.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByTestId("interpretation-result")).toBeInTheDocument();
  });

  it("validates empty text and rejects non-.txt uploads without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup({ applyAccept: false });
    renderView();

    const textarea = await screen.findByLabelText("Paste your after-visit summary");
    await user.clear(textarea);
    await user.click(screen.getByRole("button", { name: "Explain this to me" }));
    expect(screen.getByText("Paste or upload a visit summary first.")).toBeInTheDocument();

    await user.upload(screen.getByTestId("summary-file-input"), new File(["%PDF"], "visit.pdf", { type: "application/pdf" }));
    expect(await screen.findByText("Please choose a plain text (.txt) file.")).toBeInTheDocument();

    await user.upload(
      screen.getByTestId("summary-file-input"),
      new File(["Uploaded fictional summary."], "visit.txt", { type: "text/plain" }),
    );
    await waitFor(() => expect(textarea).toHaveValue("Uploaded fictional summary."));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads the sample summary back after editing", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const user = userEvent.setup();
    renderView();
    const textarea = await screen.findByLabelText("Paste your after-visit summary");
    await user.clear(textarea);
    await user.type(textarea, "My own notes");
    await user.click(screen.getByRole("button", { name: "Load my sample summary" }));
    expect(textarea).toHaveValue(activeDoc().text);
  });
});

describe("UnderstandView — Ask about a term", () => {
  it("sends free text to /api/ask-kat and shows the answer with references", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        message: {
          id: "m1",
          role: "assistant",
          content: "Here is a general explanation.",
          createdAt: "2026-11-07T00:00:00.000Z",
          referenceIds: [references[0]!.id],
          meta: { mode: "scripted_demo", generatedAt: "2026-11-07T00:00:00.000Z", disclaimer: "Education only." },
        },
        safety: { level: "none", detectedBy: "none" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderView();

    await user.click(screen.getByRole("tab", { name: "Ask about a term or condition" }));
    const input = await screen.findByLabelText("Ask about a condition, term, or question");
    await user.type(input, "What does fasting mean?");
    await user.click(screen.getByRole("button", { name: "Ask" }));

    const answer = await screen.findByTestId("term-answer");
    expect(answer).toHaveTextContent("Here is a general explanation.");
    expect(answer).toHaveTextContent("What does fasting mean?");
    expect(within(answer).getByRole("link")).toHaveAttribute("href", references[0]!.url);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/ask-kat");
    expect(JSON.parse(init.body as string)).toMatchObject({ message: "What does fasting mean?", quickPrompt: "free_text" });
  });

  it("shows the 'Not verified' note when an answer has no curated references", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          message: { id: "m1", role: "assistant", content: "Answer.", createdAt: "x", referenceIds: ["ref-unknown"] },
          safety: { level: "none", detectedBy: "none" },
        }),
      ),
    );
    const user = userEvent.setup();
    renderView();
    await user.click(screen.getByRole("tab", { name: "Ask about a term or condition" }));
    await user.type(await screen.findByLabelText("Ask about a condition, term, or question"), "Term");
    await user.click(screen.getByRole("button", { name: "Ask" }));
    expect(await screen.findByTestId("sources-not-verified")).toHaveTextContent("Not verified");
    expect(screen.queryByRole("link", { name: /ref-unknown/ })).toBeNull();
  });
});
