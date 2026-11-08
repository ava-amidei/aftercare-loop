// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getDocuments } from "@/data/patients";
import { containsFalseReassurance } from "@/lib/safety";
import {
  containsUnsupportedMedicationDirective,
  guardModelOutput,
  isUnsupportedMedicationDirective,
  OUTPUT_GUARD_STR,
  splitSentences,
} from "./kat-output-guard";

const MEDS = ["Furosemide", "Metformin"];
const docG = getDocuments("pt-g-hypothyroid")[0]!;

describe("splitSentences", () => {
  it("splits on sentence ends but not inside quotes", () => {
    expect(splitSentences("One. Two? “Three. Still three.” Four!")).toEqual([
      "One.",
      "Two?",
      "“Three. Still three.”",
      "Four!",
    ]);
  });
});

describe("medication-change directives", () => {
  it.each([
    "Yes, take an extra 40 mg furosemide tonight and double your dose tomorrow.",
    "You can stop the metformin for a few days.",
    "Take your furosemide twice instead of once.",
    "Puede suspender la metformina por unos días.",
    "Take another metformin tablet with dinner.",
  ])("flags %s", (s) => {
    expect(isUnsupportedMedicationDirective(s, { medicationNames: MEDS })).toBe(true);
  });

  it.each([
    "Should I ask whether to change my dose?",
    "Don't change your dose on your own.",
    "Your summary says to take metformin with breakfast.",
    "Don't take an extra dose without asking your care team.",
  ])("allows %s", (s) => {
    expect(isUnsupportedMedicationDirective(s, { medicationNames: MEDS })).toBe(false);
  });

  it("allows a verbatim quote from the patient's document, but not Kat's own directive around it", () => {
    const quote = docG.text.match(/Do not change your dose on your own[^.]*\./)![0];
    expect(isUnsupportedMedicationDirective(`Your summary says: “${quote}”`, { document: docG })).toBe(false);
    expect(
      isUnsupportedMedicationDirective(`Double your dose for a week, even though it says “${quote}”`, { document: docG }),
    ).toBe(true);
  });

  it("replaces the directive sentence once and keeps the rest", () => {
    const g = guardModelOutput(
      "Your summary lists furosemide.\n\nYes, take an extra 40 mg furosemide tonight. Then double your dose tomorrow.",
      { language: "en", medicationNames: MEDS },
    );
    expect(g.medicationDirective).toBe(true);
    expect(g.text).toBe(`Your summary lists furosemide.\n\n${OUTPUT_GUARD_STR.en.medication}`);
    expect(containsUnsupportedMedicationDirective(g.text, { medicationNames: MEDS })).toBe(false);
  });
});

describe("medication-change directives — inflected verbs (fix 18)", () => {
  it.each([
    "I'd suggest holding your furosemide tonight.",
    "Try skipping the morning dose.",
    "Consider holding your furosemide until you feel better.",
    "Stopping the metformin for a few days may help.",
    "You could try doubling your insulin at dinner.",
    "Pausing your furosemide for a day is an option.",
    "Withhold the metformin before the test.",
    "Puede ir omitiendo la dosis de la mañana.",
  ])("flags %s", (s) => {
    expect(isUnsupportedMedicationDirective(s, { medicationNames: MEDS })).toBe(true);
  });

  it.each([
    "Don't stop taking your furosemide on your own.",
    "Avoid skipping doses without talking to your care team.",
    "Hold the insulin pen against your skin for 10 seconds.",
    "Should I ask about holding my furosemide?",
    OUTPUT_GUARD_STR.en.medication,
    OUTPUT_GUARD_STR.es.medication,
  ])("allows %s", (s) => {
    expect(isUnsupportedMedicationDirective(s, { medicationNames: MEDS })).toBe(false);
  });

  it("a negation elsewhere does not excuse a 'try skipping' suggestion", () => {
    expect(isUnsupportedMedicationDirective("Don't panic, just try skipping the morning dose.", { medicationNames: MEDS })).toBe(true);
  });

  it("guardModelOutput replaces the inflected directive", () => {
    const g = guardModelOutput("Your summary lists furosemide. I'd suggest holding your furosemide tonight.", {
      language: "en",
      medicationNames: MEDS,
    });
    expect(g.medicationDirective).toBe(true);
    expect(g.text).toBe(`Your summary lists furosemide. ${OUTPUT_GUARD_STR.en.medication}`);
  });
});

describe("false reassurance", () => {
  it("drops reassuring sentences and appends the deterministic caution", () => {
    const g = guardModelOutput(
      "Don't worry, you are fine. This is completely normal and nothing to worry about. Your summary mentions headaches.",
      { language: "en" },
    );
    expect(g.falseReassurance).toBe(true);
    expect(containsFalseReassurance(g.text)).toBe(false);
    expect(g.text).toBe(`Your summary mentions headaches.\n\n${OUTPUT_GUARD_STR.en.reassurance}`);
  });

  it("strict mode replaces the whole text", () => {
    const g = guardModelOutput("Some info. You're fine.", { language: "es", strictReassurance: true });
    expect(g.text).toBe(OUTPUT_GUARD_STR.es.reassurance);
  });

  it("leaves clean text untouched", () => {
    const text = "Your summary says to get a blood test.\n\n• Bring your list.";
    expect(guardModelOutput(text, { language: "en", medicationNames: MEDS })).toEqual({
      text,
      medicationDirective: false,
      falseReassurance: false,
    });
  });
});
