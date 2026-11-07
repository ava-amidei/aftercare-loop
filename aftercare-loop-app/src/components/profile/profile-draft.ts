/**
 * Pure helpers for the profile editor (no React, no store).
 *
 * Condition-agnostic by design (ARCHITECTURE §2.2): nothing here looks at a
 * condition name, patient id or demographic. Data in → data out.
 */
import type {
  AccessBarrier,
  AccessibilityPreference,
  ActionOrigin,
  ExplanationLevel,
  Language,
  Medication,
  PatientProfile,
} from "@/lib/types";

/** Every field the editor can change (id and scenarioSummary are not editable). */
export interface ProfileDraft {
  displayName: string;
  ageRange: string;
  language: Language;
  explanationLevel: ExplanationLevel;
  accessibility: AccessibilityPreference[];
  conditions: string[];
  medications: Medication[];
  careInstructions: string[];
  healthGoals: string[];
  barriers: AccessBarrier[];
  /** `undefined` = the user has not opted in; a string (even "") = opted in. */
  pregnancyOrPostpartumContext?: string;
}

export type ProfilePatch = Partial<Omit<PatientProfile, "id">>;

export const ACCESS_BARRIERS: readonly AccessBarrier[] = [
  "transportation",
  "cost_or_insurance",
  "language",
  "scheduling",
  "caregiving",
];

export const ACCESSIBILITY_PREFERENCES: readonly AccessibilityPreference[] = [
  "larger_text",
  "high_contrast",
  "reduced_motion",
  "screen_reader",
];

export const EXPLANATION_LEVELS: readonly ExplanationLevel[] = ["simple", "standard", "detailed"];

export const LANGUAGES: readonly Language[] = ["en", "es"];

/** Generic age bands. Any other stored value is kept and shown as-is. */
export const AGE_RANGES: readonly string[] = ["18–24", "25–29", "30–39", "40–49", "50–59", "60–69", "70+"];

const cloneMed = (m: Medication): Medication => ({
  name: m.name ?? "",
  dose: m.dose ?? "",
  frequency: m.frequency ?? "",
  documentedPurpose: m.documentedPurpose ?? "",
});

/** Editable copy of a profile (fresh arrays; optional med fields become ""). */
export function draftFromProfile(p: PatientProfile): ProfileDraft {
  return {
    displayName: p.displayName ?? "",
    ageRange: p.ageRange ?? "",
    language: p.language,
    explanationLevel: p.explanationLevel,
    accessibility: [...(p.accessibility ?? [])],
    conditions: [...(p.conditions ?? [])],
    medications: (p.medications ?? []).map(cloneMed),
    careInstructions: [...(p.careInstructions ?? [])],
    healthGoals: [...(p.healthGoals ?? [])],
    barriers: [...(p.barriers ?? [])],
    pregnancyOrPostpartumContext: p.pregnancyOrPostpartumContext,
  };
}

const clean = (s: string | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const optional = (s: string | undefined) => clean(s) || undefined;

/** Trim, drop empties, de-duplicate case-insensitively (first spelling wins). */
export function cleanList(items: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const v = clean(raw);
    const key = v.toLocaleLowerCase();
    if (!v || seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/** Keep enum members in canonical order, de-duplicated. */
function orderedSubset<T extends string>(values: readonly T[], canonical: readonly T[]): T[] {
  const set = new Set(values);
  return canonical.filter((v) => set.has(v));
}

export function normalizeMedication(m: Medication): Medication | null {
  const name = clean(m.name);
  if (!name) return null;
  const out: Medication = { name };
  const dose = optional(m.dose);
  const frequency = optional(m.frequency);
  const documentedPurpose = optional(m.documentedPurpose);
  if (dose) out.dose = dose;
  if (frequency) out.frequency = frequency;
  if (documentedPurpose) out.documentedPurpose = documentedPurpose;
  return out;
}

/**
 * Draft → store patch. Empty optional text becomes "" for required string
 * fields and `undefined` for the optional pregnancy/postpartum context (so an
 * opt-in that was left blank stores nothing).
 */
export function draftToPatch(d: ProfileDraft): ProfilePatch {
  return {
    displayName: clean(d.displayName),
    ageRange: clean(d.ageRange),
    language: d.language,
    explanationLevel: d.explanationLevel,
    accessibility: orderedSubset(d.accessibility, ACCESSIBILITY_PREFERENCES),
    conditions: cleanList(d.conditions),
    medications: d.medications.map(normalizeMedication).filter((m): m is Medication => m !== null),
    careInstructions: cleanList(d.careInstructions),
    healthGoals: cleanList(d.healthGoals),
    barriers: orderedSubset(d.barriers, ACCESS_BARRIERS),
    pregnancyOrPostpartumContext: optional(d.pregnancyOrPostpartumContext),
  };
}

/** Stable serialization of the editable fields, for dirty checks. */
function fingerprint(patch: ProfilePatch): string {
  return JSON.stringify([
    patch.displayName,
    patch.ageRange,
    patch.language,
    patch.explanationLevel,
    patch.accessibility,
    patch.conditions,
    (patch.medications ?? []).map((m) => [m.name, m.dose ?? "", m.frequency ?? "", m.documentedPurpose ?? ""]),
    patch.careInstructions,
    patch.healthGoals,
    patch.barriers,
    patch.pregnancyOrPostpartumContext ?? "",
  ]);
}

/** True when saving the draft would change the stored profile. */
export function isDraftDirty(draft: ProfileDraft, saved: PatientProfile): boolean {
  return fingerprint(draftToPatch(draft)) !== fingerprint(draftToPatch(draftFromProfile(saved)));
}

const sameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Three-way merge when the stored profile changes underneath an open draft
 * (e.g. the header language toggle). Fields the user has not touched follow
 * the new stored value; fields the user edited keep the user's edit.
 */
export function rebaseDraft(oldBase: PatientProfile, newBase: PatientProfile, draft: ProfileDraft): ProfileDraft {
  const before = draftFromProfile(oldBase);
  const after = draftFromProfile(newBase);
  const out = { ...draft } as Record<keyof ProfileDraft, unknown>;
  for (const key of Object.keys(after) as (keyof ProfileDraft)[]) {
    if (sameValue(draft[key], before[key])) out[key] = after[key];
  }
  return out as unknown as ProfileDraft;
}

/**
 * Chip options for the condition multi-select: the draft's own selections
 * first, then labels found in other fictional profiles of the same language.
 * Purely data-driven — no condition names are hard-coded anywhere.
 */
export function buildConditionOptions(
  selected: readonly string[],
  profiles: readonly Pick<PatientProfile, "conditions" | "language">[],
  language: Language,
): string[] {
  const pool = profiles.filter((p) => p.language === language).flatMap((p) => p.conditions ?? []);
  return cleanList([...selected, ...pool]);
}

export function toggleValue<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** Case-insensitive membership after whitespace cleanup. */
export function containsText(list: readonly string[], value: string): boolean {
  const key = clean(value).toLocaleLowerCase();
  return list.some((v) => clean(v).toLocaleLowerCase() === key);
}

/**
 * Origin of a text item (care instruction, pregnancy/postpartum context):
 * unchanged from the fictional record → clinician_documented; otherwise it
 * was typed or edited here → patient_selected. Never "ai_suggested": nothing
 * on this page is generated by Kat.
 */
export function textItemOrigin(value: string, documented: readonly string[] | undefined): ActionOrigin {
  if (!clean(value)) return "patient_selected";
  return documented && containsText(documented, value) ? "clinician_documented" : "patient_selected";
}

/** A medication is clinician-documented only if every field still matches the record. */
export function medicationOrigin(m: Medication, documented: readonly Medication[] | undefined): ActionOrigin {
  const norm = normalizeMedication(m);
  if (!norm || !documented) return "patient_selected";
  const key = (x: Medication) =>
    JSON.stringify([x.name, x.dose ?? "", x.frequency ?? "", x.documentedPurpose ?? ""].map((s) => s.toLocaleLowerCase()));
  const target = key(norm);
  return documented.some((d) => {
    const nd = normalizeMedication(d);
    return nd !== null && key(nd) === target;
  })
    ? "clinician_documented"
    : "patient_selected";
}

export const EMPTY_MEDICATION: Medication = { name: "", dose: "", frequency: "", documentedPurpose: "" };

// ---------------------------------------------------------------------------
// Accessibility preferences → <html> attributes/classes
// ---------------------------------------------------------------------------

/** Class names set on <html> (aliases of the data-* hooks in globals.css). */
export const A11Y_CLASSES: Record<Exclude<AccessibilityPreference, "screen_reader">, string> = {
  larger_text: "a11y-larger-text",
  high_contrast: "a11y-high-contrast",
  reduced_motion: "a11y-reduced-motion",
};

/**
 * Applies preferences to the root element: `data-text-size="large"`,
 * `data-contrast="high"`, `data-motion="reduce"` (styled in globals.css) plus
 * matching classes. Absent preferences are removed. Idempotent.
 */
export function applyAccessibilityPrefs(
  prefs: readonly AccessibilityPreference[],
  root: HTMLElement | undefined = typeof document === "undefined" ? undefined : document.documentElement,
): void {
  if (!root) return;
  const has = (p: AccessibilityPreference) => prefs.includes(p);
  const setAttr = (name: string, value: string, on: boolean) =>
    on ? root.setAttribute(name, value) : root.removeAttribute(name);
  setAttr("data-text-size", "large", has("larger_text"));
  setAttr("data-contrast", "high", has("high_contrast"));
  setAttr("data-motion", "reduce", has("reduced_motion"));
  setAttr("data-screen-reader", "true", has("screen_reader"));
  for (const [pref, cls] of Object.entries(A11Y_CLASSES)) {
    root.classList.toggle(cls, has(pref as AccessibilityPreference));
  }
}
