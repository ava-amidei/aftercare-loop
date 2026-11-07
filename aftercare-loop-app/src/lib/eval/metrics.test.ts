import { describe, expect, it } from "vitest";
import { countMetric, normalizeText, precisionRecallF1, ratioMetric, tokenJaccard } from "./metrics";

describe("metrics", () => {
  it("ratio with zero denominator is Not evaluated (value null)", () => {
    expect(ratioMetric("x", 0, 0)).toEqual({ name: "x", numerator: 0, denominator: 0, value: null, unit: "ratio" });
    expect(ratioMetric("x", 3, 4).value).toBe(0.75);
  });

  it("count from an empty pool is Not evaluated, unless explicitly evaluated", () => {
    expect(countMetric("c", 0, 0).value).toBeNull();
    expect(countMetric("c", 0, 0, true).value).toBe(0);
    expect(countMetric("c", 2, 5)).toMatchObject({ numerator: 2, denominator: 5, value: 2, unit: "count" });
  });

  it("precision/recall/F1 from a confusion matrix", () => {
    const m = precisionRecallF1({ truePositives: 8, falsePositives: 2, falseNegatives: 2 });
    expect(m.precision).toMatchObject({ numerator: 8, denominator: 10, value: 0.8 });
    expect(m.recall).toMatchObject({ numerator: 8, denominator: 10, value: 0.8 });
    expect(m.f1).toMatchObject({ numerator: 16, denominator: 20, value: 0.8 });
    const empty = precisionRecallF1({ truePositives: 0, falsePositives: 0, falseNegatives: 0 });
    expect([empty.precision.value, empty.recall.value, empty.f1.value]).toEqual([null, null, null]);
  });

  it("token Jaccard ignores case, accents and punctuation", () => {
    expect(normalizeText("Tomé  la MEDICINA, ¡ya!")).toBe("tome la medicina ya");
    expect(tokenJaccard("Track period dates", "track PERIOD dates.")).toBe(1);
    expect(tokenJaccard("a b", "c d")).toBe(0);
    expect(tokenJaccard("", "")).toBe(0);
    expect(tokenJaccard("a b c", "a b d")).toBeCloseTo(0.5);
  });
});
