"use client";

import { OriginBadge } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { originKey } from "@/lib/i18n";
import type { ActionOrigin } from "@/lib/types";

export interface ProfileOriginBadgeProps {
  origin: ActionOrigin;
  /**
   * How to word a patient_selected item: "entered" (typed/edited here, e.g. a
   * medication) or "chosen" (a personal goal). Origin semantics are unchanged.
   */
  patientWording?: "entered" | "chosen";
  className?: string;
}

/** OriginBadge with translated, profile-specific wording. */
export function ProfileOriginBadge({ origin, patientWording = "entered", className }: ProfileOriginBadgeProps) {
  const t = useT();
  let label = t(originKey(origin));
  let description: string | undefined;
  if (origin === "clinician_documented") {
    description = t("profile.origin.fromRecord");
  } else if (origin === "patient_selected" && patientWording === "entered") {
    label = t("profile.origin.enteredByYou");
    description = t("profile.origin.enteredByYouHint");
  }
  return <OriginBadge origin={origin} label={label} description={description} size="sm" className={className} />;
}
