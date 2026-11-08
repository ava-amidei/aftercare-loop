"use client";

import { EyeDropperIcon } from "@heroicons/react/24/outline";
import { PlusIcon, TrashIcon } from "@heroicons/react/20/solid";
import { Alert, Button, Input } from "@/components/ui";
import { useT } from "@/lib/i18n";
import type { Medication } from "@/lib/types";
import { EMPTY_MEDICATION, medicationOrigin } from "./profile-draft";
import { ProfileOriginBadge } from "./ProfileOriginBadge";

export interface MedicationListEditorProps {
  medications: Medication[];
  onChange: (medications: Medication[]) => void;
  /** Medications as documented in the fictional record (for origin labels). */
  documented?: Medication[];
}

const FIELDS = [
  { key: "name", label: "profile.medication.name" },
  { key: "dose", label: "profile.medication.dose" },
  { key: "frequency", label: "profile.medication.frequency" },
  { key: "documentedPurpose", label: "profile.medication.purpose" },
] as const;

/** Name / dose / frequency / documented purpose editor. Never gives dosing advice. */
export function MedicationListEditor({ medications, onChange, documented }: MedicationListEditorProps) {
  const t = useT();
  const update = (i: number, patch: Partial<Medication>) =>
    onChange(medications.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-base font-medium text-gray-90">{t("profile.field.medications")}</legend>
      <Alert variant="info" title={t("profile.medication.doseNote")}>
        {t("profile.medication.note")}
      </Alert>
      {medications.length === 0 ? (
        <p className="rounded-2xl bg-gray-5 px-3 py-3 text-base text-gray-70">
          {t("profile.medication.empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {medications.map((m, i) => {
            const heading = m.name.trim() || t("profile.medication.unnamed");
            const groupLabel = t("profile.medication.item", { number: i + 1 });
            return (
              <li key={i}>
                <section
                  aria-label={`${groupLabel}: ${heading}`}
                  className="flex flex-col gap-3 rounded-2xl bg-gray-5 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <p className="flex items-center gap-2 font-semibold text-gray-90">
                        <EyeDropperIcon aria-hidden="true" className="size-4 shrink-0 text-primary-800" />
                        <span className="break-words">{heading}</span>
                      </p>
                      <ProfileOriginBadge origin={medicationOrigin(m, documented)} className="self-start" />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("profile.medication.removeNamed", { name: heading })}
                      onClick={() => onChange(medications.filter((_, j) => j !== i))}
                    >
                      <TrashIcon aria-hidden="true" className="size-5" />
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {FIELDS.map((f) => (
                      <Input
                        key={f.key}
                        label={t(f.label)}
                        aria-label={`${t(f.label)} (${groupLabel})`}
                        value={m[f.key] ?? ""}
                        onChange={(e) => update(i, { [f.key]: e.target.value })}
                      />
                    ))}
                  </div>
                </section>
              </li>
            );
          })}
        </ul>
      )}
      <Button
        variant="secondary"
        className="self-start"
        leftIcon={<PlusIcon aria-hidden="true" className="size-5" />}
        onClick={() => onChange([...medications, { ...EMPTY_MEDICATION }])}
      >
        {t("profile.medication.add")}
      </Button>
    </fieldset>
  );
}
