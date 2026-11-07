import { describe, expect, it } from "vitest";
import { patients } from "@/data/patients";
import type { PatientProfile } from "@/lib/types";
import {
  applyAccessibilityPrefs,
  buildConditionOptions,
  cleanList,
  draftFromProfile,
  draftToPatch,
  isDraftDirty,
  medicationOrigin,
  rebaseDraft,
  textItemOrigin,
  toggleValue,
} from "./profile-draft";

const base: PatientProfile = {
  id: "pt-test",
  displayName: "Test Person",
  ageRange: "30–39",
  language: "en",
  explanationLevel: "standard",
  accessibility: [],
  conditions: ["Condition A"],
  medications: [{ name: "Med A", dose: "10 mg", frequency: "daily", documentedPurpose: "for A" }],
  careInstructions: ["Do the thing."],
  healthGoals: ["Goal 1"],
  barriers: [],
  scenarioSummary: "Fictional test patient",
};

describe("profile-draft", () => {
  it("round-trips every fixture without becoming dirty", () => {
    expect(patients.length).toBe(12);
    for (const p of patients) {
      const d = draftFromProfile(p);
      expect(isDraftDirty(d, p)).toBe(false);
    }
  });

  it("draftFromProfile copies arrays (no shared references)", () => {
    const d = draftFromProfile(base);
    d.conditions.push("X");
    d.medications[0]!.dose = "20 mg";
    expect(base.conditions).toEqual(["Condition A"]);
    expect(base.medications[0]!.dose).toBe("10 mg");
  });

  it("draftToPatch trims, de-duplicates and drops empties", () => {
    const d = draftFromProfile(base);
    d.displayName = "  Test   Person ";
    d.conditions = [" Condition A ", "condition a", "", "B"];
    d.healthGoals = ["", "  "];
    d.medications = [
      { name: " ", dose: "1" },
      { name: "Med B", dose: " ", frequency: "", documentedPurpose: "x" },
    ];
    d.accessibility = ["reduced_motion", "larger_text", "larger_text"];
    d.barriers = ["caregiving", "transportation"];
    d.pregnancyOrPostpartumContext = "   ";
    const patch = draftToPatch(d);
    expect(patch.displayName).toBe("Test Person");
    expect(patch.conditions).toEqual(["Condition A", "B"]);
    expect(patch.healthGoals).toEqual([]);
    expect(patch.medications).toEqual([{ name: "Med B", documentedPurpose: "x" }]);
    expect(patch.accessibility).toEqual(["larger_text", "reduced_motion"]);
    expect(patch.barriers).toEqual(["transportation", "caregiving"]);
    expect(patch.pregnancyOrPostpartumContext).toBeUndefined();
    expect("id" in patch).toBe(false);
  });

  it("detects dirty changes and ignores whitespace-only edits", () => {
    const d = draftFromProfile(base);
    d.displayName = "Test Person  ";
    expect(isDraftDirty(d, base)).toBe(false);
    d.explanationLevel = "simple";
    expect(isDraftDirty(d, base)).toBe(true);
    const opted = { ...draftFromProfile(base), pregnancyOrPostpartumContext: "" };
    expect(isDraftDirty(opted, base)).toBe(false);
    expect(isDraftDirty({ ...opted, pregnancyOrPostpartumContext: "some context" }, base)).toBe(true);
  });

  it("rebaseDraft keeps user edits and follows untouched fields", () => {
    const d = { ...draftFromProfile(base), displayName: "Edited" };
    const next: PatientProfile = { ...base, displayName: "Server", language: "es" };
    const r = rebaseDraft(base, next, d);
    expect(r.displayName).toBe("Edited");
    expect(r.language).toBe("es");
  });

  it("buildConditionOptions is data-driven, language-filtered and keeps selections first", () => {
    const opts = buildConditionOptions(
      ["Mine"],
      [
        { language: "en", conditions: ["Alpha", "mine"] },
        { language: "es", conditions: ["Beta"] },
      ],
      "en",
    );
    expect(opts).toEqual(["Mine", "Alpha"]);
  });

  it("labels origins honestly", () => {
    expect(textItemOrigin("Do the thing.", base.careInstructions)).toBe("clinician_documented");
    expect(textItemOrigin("Something I typed", base.careInstructions)).toBe("patient_selected");
    expect(textItemOrigin("", base.careInstructions)).toBe("patient_selected");
    expect(textItemOrigin("Do the thing.", undefined)).toBe("patient_selected");
    const med = base.medications[0]!;
    expect(medicationOrigin({ ...med }, base.medications)).toBe("clinician_documented");
    // Editing a dose means it no longer matches the record.
    expect(medicationOrigin({ ...med, dose: "20 mg" }, base.medications)).toBe("patient_selected");
    expect(medicationOrigin({ name: "" }, base.medications)).toBe("patient_selected");
  });

  it("cleanList and toggleValue", () => {
    expect(cleanList(["a", " A", "b "])).toEqual(["a", "b"]);
    expect(toggleValue(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleValue(["a", "b"], "a")).toEqual(["b"]);
  });

  it("applyAccessibilityPrefs sets and clears html hooks", () => {
    const root = document.createElement("html");
    applyAccessibilityPrefs(["larger_text", "high_contrast", "reduced_motion"], root);
    expect(root.getAttribute("data-text-size")).toBe("large");
    expect(root.getAttribute("data-contrast")).toBe("high");
    expect(root.getAttribute("data-motion")).toBe("reduce");
    expect(root.classList.contains("a11y-larger-text")).toBe(true);
    applyAccessibilityPrefs([], root);
    expect(root.hasAttribute("data-text-size")).toBe(false);
    expect(root.hasAttribute("data-contrast")).toBe(false);
    expect(root.hasAttribute("data-motion")).toBe(false);
    expect(root.classList.contains("a11y-high-contrast")).toBe(false);
  });
});
