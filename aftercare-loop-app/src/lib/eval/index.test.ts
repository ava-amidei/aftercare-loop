// @vitest-environment node
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { EvalMetric, EvalRun } from "@/lib/types";
import { groundTruths, safetyTestCases } from "@/data/ground-truth";
import { createDefaultDeps, loadFixtureData, runDefaultEvaluation } from "./defaults";
import { EVAL_SUITE_VERSION, makeRunId, runEvaluation } from "./index";
import { readLatestEvalRun, writeEvalRun } from "./io";
import { EvalRunSchema } from "./schema";

function metric(run: EvalRun, suite: keyof EvalRun["metrics"], name: string): EvalMetric {
  const m = run.metrics[suite].find((x) => x.name === name);
  if (!m) throw new Error(`missing metric ${suite}/${name}`);
  return m;
}

describe("evaluation harness (scripted mode, fixtures)", () => {
  const saved = { force: process.env.AFTERCARE_FORCE_SCRIPTED, key: process.env.ANTHROPIC_API_KEY };
  let run: EvalRun;
  let dir: string;

  beforeAll(async () => {
    process.env.AFTERCARE_FORCE_SCRIPTED = "true";
    run = await runDefaultEvaluation({ now: () => new Date("2026-11-07T12:00:00.000Z") });
    dir = await mkdtemp(path.join(os.tmpdir(), "aftercare-eval-"));
  });

  afterAll(async () => {
    if (saved.force === undefined) delete process.env.AFTERCARE_FORCE_SCRIPTED;
    else process.env.AFTERCARE_FORCE_SCRIPTED = saved.force;
    if (saved.key !== undefined) process.env.ANTHROPIC_API_KEY = saved.key;
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it("validates against the EvalRun zod schema with honest run metadata", () => {
    expect(EvalRunSchema.safeParse(run).success).toBe(true);
    expect(run.mode).toBe("scripted_demo");
    expect(run.kind).toBe("deterministic_synthetic");
    expect(run.modelId).toBeUndefined();
    expect(run.suiteVersion).toBe(EVAL_SUITE_VERSION);
    expect(run.runId).toBe(makeRunId("2026-11-07T12:00:00.000Z"));
    expect(run.caseCount).toBe(run.cases.length);
  });

  it("extraction numerators/denominators are consistent", () => {
    const c = run.confusion!.instruction_extraction!;
    const evaluatedIds = run.cases
      .filter((x) => x.suite === "instruction_extraction" && !x.details.startsWith("Not evaluated"))
      .map((x) => x.caseId.replace("extraction:", ""));
    const expectedTotal = groundTruths
      .filter((g) => evaluatedIds.includes(g.patientId))
      .reduce((n, g) => n + g.expectedInstructions.length, 0);
    expect(c.truePositives + c.falseNegatives).toBe(expectedTotal);
    expect(metric(run, "instruction_extraction", "Precision")).toMatchObject({ numerator: c.truePositives, denominator: c.truePositives + c.falsePositives });
    expect(metric(run, "instruction_extraction", "Recall")).toMatchObject({ numerator: c.truePositives, denominator: expectedTotal });
    expect(metric(run, "instruction_extraction", "F1")).toMatchObject({
      numerator: 2 * c.truePositives,
      denominator: 2 * c.truePositives + c.falsePositives + c.falseNegatives,
    });
    const extractedTotal = metric(run, "instruction_extraction", "False positives").denominator!;
    const optional = metric(run, "instruction_extraction", "Optional instructions extracted (not counted as FP)").numerator!;
    expect(c.truePositives + c.falsePositives + optional).toBe(extractedTotal);
    expect(run.cases.filter((x) => x.suite === "instruction_extraction")).toHaveLength(groundTruths.length);
  });

  it("citation counts add up", () => {
    const checked = metric(run, "citation_validity", "Verified citations checked").numerator!;
    const valid = metric(run, "citation_validity", "Valid citations").numerator ?? 0;
    const invalid = metric(run, "citation_validity", "Invalid citations").numerator ?? 0;
    expect(valid + invalid).toBe(checked);
    expect(run.cases.filter((x) => x.suite === "citation_validity")).toHaveLength(checked);
    expect(run.cases.filter((x) => x.suite === "citation_validity" && !x.passed)).toHaveLength(invalid);
  });

  it("safety counts add up over every synthetic case", () => {
    const passed = metric(run, "safety", "Passed").numerator!;
    const failed = metric(run, "safety", "Failed").numerator!;
    expect(passed + failed).toBe(safetyTestCases.length);
    expect(metric(run, "safety", "Pass rate")).toMatchObject({ numerator: passed, denominator: safetyTestCases.length });
    const expectedEmergencies = safetyTestCases.filter((t) => t.expectedLevel === "emergency").length;
    expect(metric(run, "safety", "No emergency missed (expected emergency ⇒ got emergency)").denominator).toBe(expectedEmergencies);
    const s = run.confusion!.safety!;
    expect(s.truePositives + s.falseNegatives).toBe(expectedEmergencies);
    expect(run.cases.filter((x) => x.suite === "safety" && x.passed)).toHaveLength(passed);
  });

  it("comprehension counts add up", () => {
    const questions = groundTruths.reduce((n, g) => n + g.teachBackQuestions.length, 0);
    expect(metric(run, "comprehension", "Total questions").numerator).toBe(questions);
    const variations = groundTruths.reduce((n, g) => n + g.teachBackQuestions.reduce((k, q) => k + q.acceptedVariations.length, 0), 0);
    expect(metric(run, "comprehension", "Accepted variations scored correct").denominator).toBe(variations);
    const after = metric(run, "comprehension", "Correct after clarification");
    const unsuccessful = metric(run, "comprehension", "Unsuccessful clarifications");
    expect((after.numerator ?? 0) + (unsuccessful.numerator ?? 0)).toBe(after.denominator);
    expect(run.cases.filter((x) => x.suite === "comprehension")).toHaveLength(questions);
  });

  it("is reproducible: same inputs and clock → identical run", async () => {
    const again = await runDefaultEvaluation({ now: () => new Date("2026-11-07T12:00:00.000Z") });
    expect(again).toEqual(run);
  });

  it("writes latest.json + <runId>.json and reads them back", async () => {
    const { latest, archived } = await writeEvalRun(run, dir);
    expect(path.basename(archived)).toBe(`${run.runId}.json`);
    expect(JSON.parse(await readFile(latest, "utf8"))).toEqual(JSON.parse(await readFile(archived, "utf8")));
    const back = await readLatestEvalRun(dir);
    expect(back).toEqual({ status: "ok", run: JSON.parse(await readFile(latest, "utf8")) });
    expect(await readLatestEvalRun(path.join(dir, "nope"))).toEqual({ status: "missing" });
  });
});

describe("evaluation harness run metadata", () => {
  it("live extraction makes the run model_based with the reported model id", async () => {
    const deps = createDefaultDeps({
      getAiMode: () => "live_claude",
      getModelId: () => "configured-model",
      extractInstructions: async () => ({ instructions: [], source: "live", model: "reported-model" }),
    });
    const r = await runEvaluation(deps, loadFixtureData());
    expect(r.kind).toBe("model_based");
    expect(r.modelId).toBe("reported-model");
    expect(EvalRunSchema.safeParse(r).success).toBe(true);
  });

  it("live mode whose extraction fell back to the heuristic stays deterministic and records the error", async () => {
    const deps = createDefaultDeps({
      getAiMode: () => "live_claude",
      getModelId: () => "configured-model",
      extractInstructions: async () => ({ instructions: [], source: "heuristic", error: "rate_limited" }),
    });
    const r = await runEvaluation(deps, loadFixtureData());
    expect(r.kind).toBe("deterministic_synthetic");
    expect(r.modelId).toBeUndefined();
    expect(r.errors.some((e) => e.includes("rate_limited"))).toBe(true);
  });

  it("empty data → every metric Not evaluated", async () => {
    const r = await runEvaluation(createDefaultDeps({ getAiMode: () => "scripted_demo" }), {
      patients: [],
      documents: [],
      groundTruths: [],
      safetyTestCases: [],
    });
    const all = Object.values(r.metrics).flat();
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((m) => m.value === null)).toBe(true);
    expect(r.caseCount).toBe(0);
  });
});
