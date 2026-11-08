"use client";

import { useId, type ChangeEvent } from "react";
import { ChevronDownIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/Toast";
import { getTranslator, useT } from "@/lib/i18n";
import { useDemoStore } from "@/lib/store/demo-store";
import { useHasHydrated } from "@/lib/store/hydration";
import { usePatientProfiles } from "@/lib/store/selectors";
import { cn } from "@/lib/utils/cn";

export interface PatientSwitcherProps {
  className?: string;
}

/**
 * Header control listing every fictional fixture patient (name + scenario).
 * Native <select> for the best screen-reader and mobile support. Switching only
 * changes `activePatientId`; chat and progress stay scoped to each patient in
 * the store, so another patient's conversation is never shown.
 */
export function PatientSwitcher({ className }: PatientSwitcherProps) {
  const t = useT();
  const id = useId();
  const hydrated = useHasHydrated();
  const profiles = usePatientProfiles();
  const activePatientId = useDemoStore((s) => s.activePatientId);
  const switchPatient = useDemoStore((s) => s.switchPatient);
  const { toast } = useToast();

  const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    if (!next || next === activePatientId) return;
    switchPatient(next);
    const profile = useDemoStore.getState().patients[next]?.profile;
    if (profile) {
      // Announce in the newly selected patient's language (the UI follows it).
      const tNext = getTranslator(profile.language);
      toast({
        title: tNext("common.patientSwitcher.switchedTo", { name: profile.displayName }),
        variant: "info",
        duration: 3000,
      });
    }
  };

  if (profiles.length === 0) {
    return (
      <span className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-medium text-gray-70">
        <UserCircleIcon aria-hidden="true" className="size-4" />
        {t("dashboard.switcher.placeholder")}
      </span>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)} data-testid="patient-switcher">
      <label htmlFor={id} className="sr-only lg:not-sr-only lg:text-sm lg:font-medium lg:text-gray-70">
        {t("common.patientSwitcher.label")}
      </label>
      {/* Full width on its own mobile header row; capped widths from md up. */}
      <div className="relative min-w-0 flex-1 md:flex-none">
        <UserCircleIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-primary-800"
        />
        <select
          id={id}
          value={activePatientId}
          onChange={onChange}
          disabled={!hydrated}
          aria-busy={!hydrated || undefined}
          className={cn(
            "min-h-11 w-full appearance-none truncate rounded-full bg-gray-5 transition-colors hover:bg-gray-10",
            "py-2 pr-9 pl-9 text-sm font-semibold text-gray-90 md:max-w-[16rem] lg:max-w-[20rem]",
            "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary-700",
            "disabled:cursor-wait disabled:opacity-70",
          )}
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.scenarioSummary
                ? t("dashboard.switcher.option", { name: p.displayName, summary: p.scenarioSummary })
                : p.displayName}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-gray-70"
        />
      </div>
    </div>
  );
}
