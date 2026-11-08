import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { EvalRun } from "@/lib/types";
import { EvaluationDashboard } from "./EvaluationDashboard";
import { makeRun } from "./test-fixtures";

const DISCLAIMER =
  "Automated synthetic-case tests. Not clinical validation. No real users. Does not establish real-world health outcomes.";

function fetchReturning(status: number, body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));
}

async function renderReady(run: EvalRun = makeRun()) {
  const fetchImpl = fetchReturning(200, run);
  render(<EvaluationDashboard fetchImpl={fetchImpl as unknown as typeof fetch} />);
  await screen.findByText(run.runId);
  return fetchImpl;
}

describe("EvaluationDashboard", () => {
  it("shows a loading state, then the run metadata from the file", async () => {
    const fetchImpl = fetchReturning(200, makeRun());
    render(<EvaluationDashboard fetchImpl={fetchImpl as unknown as typeof fetch} />);
    expect(screen.getByRole("status", { name: "" })).toHaveTextContent("Loading evaluation results…");
    expect(await screen.findByText("eval-test-run")).toBeInTheDocument();
    expect(fetchImpl).toHaveBeenCalledWith("/api/eval/latest", expect.objectContaining({ cache: "no-store" }));
    expect(screen.getByText("9.9.9")).toBeInTheDocument();
    expect(screen.getByText("n/a (scripted)")).toBeInTheDocument();
    expect(screen.getByText("Automated deterministic tests (synthetic data)")).toBeInTheDocument();
    expect(screen.getAllByText(/Scripted Demo Mode/).length).toBeGreaterThan(0);
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
    expect(screen.getByRole("rowheader", { name: "Automated tests on synthetic cases" }).closest("tr")).toHaveTextContent("This run");
    expect(screen.getByRole("rowheader", { name: "Human-reviewed results" }).closest("tr")).toHaveTextContent("None yet");
    expect(screen.getByRole("rowheader", { name: "Genuine user testing" }).closest("tr")).toHaveTextContent("None yet");
  });

  it("renders metric values, fractions and 'Not evaluated' for null/empty suites", async () => {
    await renderReady();
    const extraction = screen.getByRole("region", { name: "Instruction extraction" });
    expect(within(extraction).getAllByText("75%").length).toBeGreaterThan(0);
    expect(within(extraction).getByText("6 / 8")).toBeInTheDocument(); // F1 headline
    expect(within(extraction).getByRole("rowheader", { name: "Precision" }).closest("tr")).toHaveTextContent("3 of 4");
    // Confusion matrix (no TN defined for extraction → n/a)
    const matrix = within(extraction).getByRole("table", { name: /Confusion matrix/ });
    expect(within(matrix).getByText("n/a")).toBeInTheDocument();

    const citations = screen.getByRole("region", { name: "Citation validity" });
    expect(within(citations).getAllByText("Not evaluated").length).toBeGreaterThan(0);
    const comprehension = screen.getByRole("region", { name: "Comprehension" });
    expect(within(comprehension).getAllByText("Not evaluated").length).toBeGreaterThan(0);
  });

  it("lists safety failures in an expandable section", async () => {
    const user = userEvent.setup();
    await renderReady();
    const safety = screen.getByRole("region", { name: "Safety" });
    expect(within(safety).getAllByText("50%").length).toBeGreaterThan(0);
    const summary = within(safety).getByText("Failure details (1)");
    await user.click(summary);
    expect(within(safety).getByText("Expected emergency, got none.")).toBeVisible();
  });

  it("filters the per-case table by suite and result", async () => {
    const user = userEvent.setup();
    await renderReady();
    const cases = screen.getByRole("region", { name: "Individual results" });
    expect(within(cases).getAllByTestId("eval-case-row")).toHaveLength(4);
    expect(within(cases).getByText("Showing 4 of 4 cases")).toBeInTheDocument();

    await user.selectOptions(within(cases).getByLabelText("Suite"), "safety");
    expect(within(cases).getAllByTestId("eval-case-row")).toHaveLength(2);

    await user.selectOptions(within(cases).getByLabelText("Result"), "failed");
    const rows = within(cases).getAllByTestId("eval-case-row");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("safety-b-1");

    await user.selectOptions(within(cases).getByLabelText("Suite"), "comprehension");
    expect(within(cases).getByText("No cases match these filters.")).toBeInTheDocument();
  });

  it("shows the model id and model-based kind for live runs", async () => {
    await renderReady(makeRun({ mode: "live_claude", modelId: "claude-test-model", kind: "model_based" }));
    expect(screen.getAllByText("claude-test-model").length).toBeGreaterThan(0);
    expect(screen.getByText("Model-based tests")).toBeInTheDocument();
    expect(screen.queryByText("n/a (scripted)")).not.toBeInTheDocument();
  });

  it("labels scripted-mode suites honestly and shows run id, suite version and kind on each card (fix 4)", async () => {
    await renderReady();
    const extraction = screen.getByRole("region", { name: "Instruction extraction" });
    expect(within(extraction).getByTestId("eval-honesty-caption")).toHaveTextContent(
      "Only heuristic-extracted patients (no scripted response) measure extraction",
    );
    expect(within(screen.getByRole("region", { name: "Citation validity" })).getByTestId("eval-honesty-caption")).toHaveTextContent(
      "not a model's citation accuracy",
    );
    expect(within(screen.getByRole("region", { name: "Comprehension" })).getByTestId("eval-honesty-caption")).toHaveTextContent(
      "Simulated answers taken from the question record",
    );
    expect(within(screen.getByRole("region", { name: "Safety" })).queryByTestId("eval-honesty-caption")).toBeNull();
    const footers = screen.getAllByTestId("eval-card-run");
    expect(footers).toHaveLength(4);
    expect(footers[0]).toHaveTextContent("Run eval-test-run · suite 9.9.9 · Automated deterministic tests (synthetic data)");
  });

  it("does not show the deterministic extraction/citation captions for model-based runs", async () => {
    await renderReady(makeRun({ mode: "live_gemini", modelId: "gemini-x", kind: "model_based" }));
    expect(within(screen.getByRole("region", { name: "Instruction extraction" })).queryByTestId("eval-honesty-caption")).toBeNull();
    expect(within(screen.getByRole("region", { name: "Citation validity" })).queryByTestId("eval-honesty-caption")).toBeNull();
    expect(within(screen.getByRole("region", { name: "Comprehension" })).getByTestId("eval-honesty-caption")).toBeInTheDocument();
  });

  it("renders two labeled RunMetadata blocks for scripted and model-based runs, with a results switch (fix 10)", async () => {
    const user = userEvent.setup();
    const scripted = makeRun();
    const live = makeRun({
      runId: "eval-live-run",
      mode: "live_gemini",
      modelId: "gemini-test",
      kind: "model_based",
      partial: true,
      cases: [
        { caseId: "extraction:pt-a", suite: "instruction_extraction", passed: true, details: "TP 1 via live", actual: { source: "live" } },
        { caseId: "extraction:pt-b", suite: "instruction_extraction", passed: false, details: "TP 0 via heuristic", actual: { source: "heuristic" } },
        { caseId: "extraction:pt-c", suite: "instruction_extraction", passed: false, details: "Not evaluated: extraction failed (x)." },
      ],
    } as Partial<EvalRun>);
    const fetchImpl = fetchReturning(200, { scripted, live });
    render(<EvaluationDashboard fetchImpl={fetchImpl as unknown as typeof fetch} />);
    const scriptedBlock = await screen.findByRole("region", { name: "Scripted run (deterministic, no model calls)" });
    const liveBlock = screen.getByRole("region", { name: "Model-based run (live provider)" });
    expect(within(scriptedBlock).getByText("eval-test-run")).toBeInTheDocument();
    expect(within(scriptedBlock).getByText(/latest\.json/)).toBeInTheDocument();
    expect(within(liveBlock).getByText("eval-live-run")).toBeInTheDocument();
    expect(within(liveBlock).getAllByText("gemini-test").length).toBeGreaterThan(0);
    expect(within(liveBlock).getByText(/latest-live\.json/)).toBeInTheDocument();
    expect(within(liveBlock).getByTestId("eval-run-partial")).toBeInTheDocument();
    expect(within(liveBlock).getByText(/1 from the live model, 1 fell back to the heuristic extractor, 1 not run/)).toBeInTheDocument();

    const tabs = screen.getByRole("tablist", { name: "Show results for" });
    expect(within(tabs).getByRole("tab", { name: "Scripted run" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByTestId("eval-card-run")[0]).toHaveTextContent("Run eval-test-run");
    await user.click(within(tabs).getByRole("tab", { name: "Model-based run" }));
    expect(screen.getAllByTestId("eval-card-run")[0]).toHaveTextContent("Run eval-live-run · suite 9.9.9 · Model-based tests");
  });

  it("says no model-based run is recorded when only latest.json exists", async () => {
    render(<EvaluationDashboard fetchImpl={fetchReturning(200, { scripted: makeRun(), live: null }) as unknown as typeof fetch} />);
    const liveBlock = await screen.findByRole("region", { name: "Model-based run (live provider)" });
    expect(within(liveBlock).getByText("No model-based run has been recorded yet.")).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it("shows run errors when the file records them", async () => {
    await renderReady(makeRun({ errors: ["ground-truth:pt-x: document missing"] }));
    expect(screen.getByText("Errors recorded during this run")).toBeInTheDocument();
    expect(screen.getByText("ground-truth:pt-x: document missing")).toBeInTheDocument();
  });

  it("shows run instructions when no evaluation exists (404)", async () => {
    render(<EvaluationDashboard fetchImpl={fetchReturning(404, { notEvaluated: true }) as unknown as typeof fetch} />);
    expect(await screen.findByText("Not evaluated — run npm run eval")).toBeInTheDocument();
    expect(screen.getByText(/npm run eval/, { selector: "code" })).toBeInTheDocument();
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
  });

  it("shows an error state with retry that refetches", async () => {
    const user = userEvent.setup();
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(new Response(JSON.stringify(makeRun()), { status: 200 }));
    render(<EvaluationDashboard fetchImpl={fetchImpl as unknown as typeof fetch} />);
    expect(await screen.findByText("We couldn't load the evaluation results.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByText("eval-test-run")).toBeInTheDocument());
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
