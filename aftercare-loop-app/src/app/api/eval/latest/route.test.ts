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

  it("returns the stored run", async () => {
    await mkdir(path.join(dir, "eval-results"));
    await writeFile(path.join(dir, "eval-results", "latest.json"), JSON.stringify(sample));
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(sample);
  });

  it("500 without echoing content when the file is not a valid EvalRun", async () => {
    await mkdir(path.join(dir, "eval-results"));
    await writeFile(path.join(dir, "eval-results", "latest.json"), JSON.stringify({ hello: "world" }));
    const res = await GET();
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("world");
  });
});
