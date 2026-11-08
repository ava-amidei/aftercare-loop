import { describe, expect, it } from "vitest";
import { parseLatestEvalResponse } from "./use-latest-eval";
import { makeRun } from "./test-fixtures";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("parseLatestEvalResponse", () => {
  it("maps 404 to not_evaluated", async () => {
    expect(await parseLatestEvalResponse(json({ notEvaluated: true }, 404))).toEqual({ status: "not_evaluated" });
  });

  it("returns the validated run on 200", async () => {
    const run = makeRun();
    const state = await parseLatestEvalResponse(json(run));
    expect(state.status).toBe("ready");
    if (state.status === "ready") {
      expect(state.run?.runId).toBe(run.runId);
      expect(state.live).toBeNull();
    }
  });

  it("parses the { scripted, live } payload and slots legacy model-based runs as live", async () => {
    const scripted = makeRun();
    const live = makeRun({ runId: "eval-live", mode: "live_gemini", kind: "model_based", modelId: "gemini-x" });
    const both = await parseLatestEvalResponse(json({ scripted, live }));
    expect(both).toMatchObject({ status: "ready", run: { runId: "eval-test-run" }, live: { runId: "eval-live" } });

    const liveOnly = await parseLatestEvalResponse(json({ scripted: null, live }));
    expect(liveOnly).toMatchObject({ status: "ready", run: null, live: { runId: "eval-live" } });

    expect(await parseLatestEvalResponse(json(live))).toMatchObject({ status: "ready", run: null, live: { runId: "eval-live" } });
    expect(await parseLatestEvalResponse(json({ scripted: null, live: null }))).toEqual({ status: "not_evaluated" });
  });

  it("keeps the scripted run when the live slot is unreadable", async () => {
    const state = await parseLatestEvalResponse(json({ scripted: makeRun(), live: { runId: "x" } }));
    expect(state).toMatchObject({ status: "ready", run: { runId: "eval-test-run" }, live: null });
    if (state.status === "ready") expect(state.liveError).toMatch(/model-based/);
  });

  it("rejects bodies that don't match the EvalRun schema", async () => {
    const state = await parseLatestEvalResponse(json({ runId: "x" }));
    expect(state.status).toBe("error");
  });

  it("surfaces server error messages", async () => {
    expect(await parseLatestEvalResponse(json({ error: "Stored evaluation results are unreadable." }, 500))).toEqual({
      status: "error",
      message: "Stored evaluation results are unreadable.",
    });
    expect(await parseLatestEvalResponse(new Response("oops", { status: 500 }))).toEqual({
      status: "error",
      message: undefined,
    });
  });
});
