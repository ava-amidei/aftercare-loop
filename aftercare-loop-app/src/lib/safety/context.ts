/**
 * Safety context derived from a (fictional) patient profile — the ONE place
 * every caller (Ask Kat, document interpreter, teach-back, follow-up forms)
 * gets profile-based safety options, so the same message always gets the same
 * verdict for the same patient.
 *
 * Semantics: `pregnancyOrPostpartumContext` is present only when the record
 * documents pregnancy OR a recent birth. Both enable the maternal warning-sign
 * rules (the `severe_postpartum_warning` scenario, whose guidance is worded for
 * "during pregnancy or after giving birth"). No free-text keyword sniffing.
 */
import type { PatientProfile } from "@/lib/types";
import type { SafetyOptions } from "./rules";

export type ProfileSafetyContext = Required<Pick<SafetyOptions, "postpartumContext">>;

/** True when the profile documents pregnancy or postpartum context (non-blank field). */
export function hasDocumentedPregnancyOrPostpartumContext(
  profile: Pick<PatientProfile, "pregnancyOrPostpartumContext"> | null | undefined,
): boolean {
  const field = profile?.pregnancyOrPostpartumContext;
  return typeof field === "string" && field.trim().length > 0;
}

/** Profile-derived options for `evaluateSafety` (spread into its options). */
export function safetyContextOf(
  profile: Pick<PatientProfile, "pregnancyOrPostpartumContext"> | null | undefined,
): ProfileSafetyContext {
  return { postpartumContext: hasDocumentedPregnancyOrPostpartumContext(profile) };
}
