import { describe, expect, it } from "vitest";
import type { SafetyTestCase, SafetyVerdict } from "@/lib/types";
import { safetyTestCases } from "@/data/ground-truth";
import { evaluateSafety } from "@/lib/safety";
import { runSafetySuite } from "./safety";

const emergency: SafetyTestCase = {
  id: "e1",
  scenario: "chest_pain",
  input: "EMERGENCY",
  expectedLevel: "emergency",
  forbiddenPhrases: ["you are fine"],
  requiredConcepts: ["911"],
};
const benign: SafetyTestCase = { id: "b1", scenario: "benign_control", input: "benign", expectedLevel: "none", forbiddenPhrases: ["you are fine"] };

const byName = (r: ReturnType<typeof runSafetySuite>) => Object.fromEntries(r.metrics.map((m) => [m.name, m]));

describe("runSafetySuite", () => {
  it("passes exact level + required concept, and computes the emergency confusion matrix", () => {
    const evaluate = (t: string): SafetyVerdict =>
      t === "EMERGENCY" ? { level: "emergency", detectedBy: "rules", guidance: "Call 911 now." } : { level: "none", detectedBy: "none" };
    const r = runSafetySuite([emergency, benign], evaluate);
    expect(r.cases.every((c) => c.passed)).toBe(true);
    expect(r.confusion).toEqual({ truePositives: 1, falsePositives: 0, falseNegatives: 0, trueNegatives: 1 });
    expect(byName(r)["Pass rate"]).toMatchObject({ numerator: 2, denominator: 2, value: 1 });
  });

  it("fails on missing concept, forbidden phrase, or level mismatch; lenient metric tracks missed emergencies", () => {
    const cases = [emergency, { ...emergency, id: "e2", input: "E2" }, { ...benign, input: "B" }];
    const evaluate = (t: string): SafetyVerdict => {
      if (t === "EMERGENCY") return { level: "emergency", detectedBy: "rules", guidance: "You are fine." };
      if (t === "E2") return { level: "concerning", detectedBy: "rules", guidance: "Please contact your clinic." };
      return { level: "concerning", detectedBy: "rules", guidance: "Contact your clinic." };
    };
    const r = runSafetySuite(cases, evaluate);
    expect(r.cases.map((c) => c.passed)).toEqual([false, false, false]);
    expect(r.cases[0]!.details).toMatch(/forbidden.*you are fine/);
    expect(r.cases[0]!.details).toMatch(/missing required concept\(s\): 911/);
    const m = byName(r);
    expect(m["No emergency missed (expected emergency ⇒ got emergency)"]).toMatchObject({ numerator: 1, denominator: 2 });
    expect(m["Failed"]).toMatchObject({ numerator: 3, denominator: 3 });
  });

  it("records thrown errors as not-evaluated failures", () => {
    const r = runSafetySuite([benign], () => {
      throw new Error("nope");
    });
    expect(r.errors).toEqual(["b1: nope"]);
    expect(byName(r)["Pass rate"]!.value).toBeNull();
  });

  it("runs over the real synthetic suite with consistent numerators", () => {
    const r = runSafetySuite(safetyTestCases, (t) => evaluateSafety(t));
    const m = byName(r);
    expect(m["Passed"]!.numerator! + m["Failed"]!.numerator!).toBe(safetyTestCases.length);
    const c = r.confusion;
    expect(c.truePositives + c.falsePositives + c.falseNegatives + (c.trueNegatives ?? 0)).toBe(safetyTestCases.length);
  });
});
