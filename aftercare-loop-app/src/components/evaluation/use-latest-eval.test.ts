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
    if (state.status === "ready") expect(state.run.runId).toBe(run.runId);
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
