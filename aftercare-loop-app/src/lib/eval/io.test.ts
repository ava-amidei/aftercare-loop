// @vitest-environment node
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { EvalRun } from "@/lib/types";
import {
  LATEST_FILENAME,
  LATEST_LIVE_FILENAME,
  parseEvalCliArgs,
  readEvalRunFile,
  readLatestEvalRuns,
  resolveOutFilename,
  writeEvalRun,
} from "./io";

const run: EvalRun = {
  runId: "eval-io-test",
  suiteVersion: "1.0.0",
  timestamp: "2026-11-08T12:00:00.000Z",
  mode: "scripted_demo",
  kind: "deterministic_synthetic",
  caseCount: 0,
  metrics: { instruction_extraction: [], citation_validity: [], safety: [], comprehension: [] },
  cases: [],
  errors: [],
};

describe("parseEvalCliArgs", () => {
  it("defaults to scripted mode, latest.json, sequential, no budget", () => {
    expect(parseEvalCliArgs([])).toEqual({ mode: "scripted", out: LATEST_FILENAME, concurrency: 1, budgetMs: null });
  });

  it("parses --mode live --out latest-live.json (both flag styles)", () => {
    expect(parseEvalCliArgs(["--mode", "live", "--out", "latest-live.json"])).toEqual({
      mode: "live",
      out: LATEST_LIVE_FILENAME,
      concurrency: 3,
      budgetMs: null,
    });
    expect(parseEvalCliArgs(["--mode=live", "--out=x.json", "--concurrency=2", "--budget-min=1.5"])).toEqual({
      mode: "live",
      out: "x.json",
      concurrency: 2,
      budgetMs: 90_000,
    });
  });

  it("rejects unknown flags, bad modes, missing values and unsafe --out paths", () => {
    expect(() => parseEvalCliArgs(["--nope", "1"])).toThrow(/Unknown flag/);
    expect(() => parseEvalCliArgs(["--mode", "fast"])).toThrow(/--mode/);
    expect(() => parseEvalCliArgs(["--out"])).toThrow(/needs a value/);
    expect(() => parseEvalCliArgs(["--concurrency", "0"])).toThrow(/concurrency/);
    expect(() => resolveOutFilename("../latest.json")).toThrow(/plain .json filename/);
    expect(() => resolveOutFilename("sub/latest.json")).toThrow(/plain .json filename/);
    expect(() => resolveOutFilename("latest.txt")).toThrow(/plain .json filename/);
  });
});

describe("writeEvalRun / readLatestEvalRuns", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "aftercare-io-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("writes to --out and the archive, leaving latest.json alone", async () => {
    const live = { ...run, runId: "eval-io-live", mode: "live_gemini" as const, kind: "model_based" as const, modelId: "m", partial: true };
    const { latest, archived } = await writeEvalRun(live, dir, LATEST_LIVE_FILENAME);
    expect(path.basename(latest)).toBe(LATEST_LIVE_FILENAME);
    expect(path.basename(archived)).toBe("eval-io-live.json");
    expect(JSON.parse(await readFile(latest, "utf8"))).toMatchObject({ runId: "eval-io-live", partial: true });
    expect((await readEvalRunFile(dir, LATEST_FILENAME)).status).toBe("missing");

    const both = await readLatestEvalRuns(dir);
    expect(both.scripted.status).toBe("missing");
    expect(both.live).toMatchObject({ status: "ok", run: { runId: "eval-io-live", partial: true } });
  });

  it("reports an invalid live file without affecting the scripted one", async () => {
    await writeEvalRun(run, dir);
    await writeFile(path.join(dir, LATEST_LIVE_FILENAME), "{oops", "utf8");
    const both = await readLatestEvalRuns(dir);
    expect(both.scripted).toMatchObject({ status: "ok", run: { runId: "eval-io-test" } });
    expect(both.live).toEqual({ status: "invalid", reason: "latest-live.json is not valid JSON" });
  });
});
