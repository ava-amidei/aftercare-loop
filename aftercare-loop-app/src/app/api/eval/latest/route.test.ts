// @vitest-environment node
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EvalRun } from "@/lib/types";
import { GET } from "./route";

const sample: EvalRun = {
  runId: "eval-test",
  suiteVersion: "1.0.0",
  timestamp: "2026-11-07T12:00:00.000Z",
  mode: "scripted_demo",
  kind: "deterministic_synthetic",
  caseCount: 0,
  metrics: { instruction_extraction: [], citation_validity: [], safety: [], comprehension: [] },
  cases: [],
  errors: [],
};

describe("GET /api/eval/latest", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "aftercare-route-"));
    vi.spyOn(process, "cwd").mockReturnValue(dir);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(dir, { recursive: true, force: true });
  });

  it("404 { notEvaluated: true } when no run exists", async () => {
    const res = await GET();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ notEvaluated: true });
  });

  it("returns the stored scripted run with live: null when no model-based run exists", async () => {
    await mkdir(path.join(dir, "eval-results"));
    await writeFile(path.join(dir, "eval-results", "latest.json"), JSON.stringify(sample));
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ scripted: sample, live: null });
  });

  it("returns both latest.json and latest-live.json when present", async () => {
    const live: EvalRun = { ...sample, runId: "eval-live", mode: "live_gemini", kind: "model_based", modelId: "gemini-test" };
    await mkdir(path.join(dir, "eval-results"));
    await writeFile(path.join(dir, "eval-results", "latest.json"), JSON.stringify(sample));
    await writeFile(path.join(dir, "eval-results", "latest-live.json"), JSON.stringify({ ...live, partial: true }));
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ scripted: sample, live: { ...live, partial: true } });
  });

  it("returns the live run alone, and flags an unreadable live file without failing", async () => {
    await mkdir(path.join(dir, "eval-results"));
    await writeFile(path.join(dir, "eval-results", "latest-live.json"), JSON.stringify(sample));
    expect(await (await GET()).json()).toEqual({ scripted: null, live: sample });

    await writeFile(path.join(dir, "eval-results", "latest.json"), JSON.stringify(sample));
    await writeFile(path.join(dir, "eval-results", "latest-live.json"), "{not json");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.scripted).toEqual(sample);
    expect(body.live).toBeNull();
    expect(body.liveError).toMatch(/unreadable/);
  });

  it("500 without echoing content when the file is not a valid EvalRun", async () => {
    await mkdir(path.join(dir, "eval-results"));
    await writeFile(path.join(dir, "eval-results", "latest.json"), JSON.stringify({ hello: "world" }));
    const res = await GET();
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("world");
  });
});
