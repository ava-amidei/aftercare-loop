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
