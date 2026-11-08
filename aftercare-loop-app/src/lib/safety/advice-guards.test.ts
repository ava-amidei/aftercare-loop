import { describe, expect, it } from "vitest";
import {
  conflictsWithFluidRestriction,
  descriptionAddsMedicationChange,
  detectDocumentedRestrictions,
  isFluidRestrictionText,
  isMedicationChangeDirective,
} from "./advice-guards";

const limited = { fluid: true, diet: false, fluidTarget: true };

describe("advice guards", () => {
  it("detects a medication change the quote does not state", () => {
    expect(descriptionAddsMedicationChange("Increase your furosemide to 80 mg if swollen", "Take furosemide 40 mg once each morning.")).toBe(true);
    expect(descriptionAddsMedicationChange("Stop taking it early", "Take it with food.", [])).toBe(false);
    expect(descriptionAddsMedicationChange("Stop furosemide early", "Take furosemide 40 mg.", ["Furosemide"])).toBe(true);
    expect(descriptionAddsMedicationChange("Reduce insulin to 15 units", "Reduce insulin glargine to 15 units at bedtime.")).toBe(false);
    expect(isMedicationChangeDirective("Should I lower my dose?")).toBe(false);
  });

  it("flags generic hydration advice only against a documented fluid limit", () => {
    expect(conflictsWithFluidRestriction(["Drink plenty of water"], limited)).toBe(true);
    expect(conflictsWithFluidRestriction(["Drink plenty of water"], { fluid: false, diet: false, fluidTarget: true })).toBe(false);
    expect(conflictsWithFluidRestriction(["Keep your fluid intake under the limit", "Limit your total fluids to 1.5 liters per day."], limited)).toBe(false);
    expect(isFluidRestrictionText("Drink 2 to 3 liters of fluid each day.")).toBe(true);
  });

  it("detects documented restrictions from document text and care instructions", () => {
    expect(detectDocumentedRestrictions({ careInstructions: ["Limit total fluids to 1.5 liters per day."] }, null).fluid).toBe(true);
    expect(detectDocumentedRestrictions({ careInstructions: [] }, { text: "Follow a low-sodium diet." }).diet).toBe(true);
  });

  it("matches inflected medication-change verbs (fix 18)", () => {
    expect(isMedicationChangeDirective("holding your furosemide", ["Furosemide"])).toBe(true);
    expect(isMedicationChangeDirective("try skipping the morning dose")).toBe(true);
    expect(isMedicationChangeDirective("Consider pausing the metformin", ["Metformin"])).toBe(true);
    expect(isMedicationChangeDirective("Discontinuing the pills early")).toBe(true);
    expect(isMedicationChangeDirective("Siga omitiendo la dosis de la noche")).toBe(true);
    expect(isMedicationChangeDirective("Hold the insulin pen in place for 10 seconds")).toBe(false);
    expect(isMedicationChangeDirective("Should I try skipping the morning dose?")).toBe(false);
    expect(descriptionAddsMedicationChange("Try holding your furosemide", "Take furosemide 40 mg each morning.", ["Furosemide"])).toBe(true);
  });
});
