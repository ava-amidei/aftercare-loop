import { describe, expect, it } from "vitest";
import { patients } from "@/data/patients";
import { evaluateSafety, getSafetyGuidance } from "./index";
import { hasDocumentedPregnancyOrPostpartumContext, safetyContextOf } from "./context";

describe("safetyContextOf", () => {
  it("is true exactly when the profile documents pregnancy or postpartum context", () => {
    for (const p of patients) {
      const documented = typeof p.pregnancyOrPostpartumContext === "string" && p.pregnancyOrPostpartumContext.trim() !== "";
      expect(safetyContextOf(p)).toEqual({ postpartumContext: documented });
    }
  });

  it("treats a documented pregnancy (not postpartum) the same as postpartum", () => {
    const pregnant = patients.find((p) => /pregnant/i.test(p.pregnancyOrPostpartumContext ?? ""));
    expect(pregnant).toBeDefined();
    expect(hasDocumentedPregnancyOrPostpartumContext(pregnant)).toBe(true);
    const v = evaluateSafety("I have a fever of 101", { language: pregnant!.language, ...safetyContextOf(pregnant) });
    // Fever follows the documented "call the clinic" tier (validation fix 6).
    expect(v.level).toBe("concerning");
    expect(v.scenario).toBe("severe_postpartum_warning");
    // Guidance must not assume a birth has happened.
    expect(v.guidance).toMatch(/during pregnancy or after giving birth/);
  });

  it("is false for blank, missing or null profiles", () => {
    expect(safetyContextOf(null).postpartumContext).toBe(false);
    expect(safetyContextOf({}).postpartumContext).toBe(false);
    expect(safetyContextOf({ pregnancyOrPostpartumContext: "   " }).postpartumContext).toBe(false);
  });

  it("maternal guidance covers pregnancy and recent birth in both languages", () => {
    expect(getSafetyGuidance("emergency", "severe_postpartum_warning", "en")).toMatch(/during pregnancy or after giving birth/);
    expect(getSafetyGuidance("concerning", "severe_postpartum_warning", "en")).toMatch(/during pregnancy or after giving birth/);
    expect(getSafetyGuidance("emergency", "severe_postpartum_warning", "es")).toMatch(/durante el embarazo o después del parto/);
    expect(getSafetyGuidance("concerning", "severe_postpartum_warning", "es")).toMatch(/durante el embarazo o después del parto/);
  });
});
