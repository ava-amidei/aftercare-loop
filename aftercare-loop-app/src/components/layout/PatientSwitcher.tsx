"use client";

import { useId, type ChangeEvent } from "react";
import { ChevronDown, UserRound } from "lucide-react";
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
      <span className="inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-medium text-ink-muted">
        <UserRound aria-hidden="true" className="size-4" />
        {t("dashboard.switcher.placeholder")}
      </span>
    );
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)} data-testid="patient-switcher">
      <label htmlFor={id} className="sr-only lg:not-sr-only lg:text-sm lg:font-medium lg:text-ink-muted">
        {t("common.patientSwitcher.label")}
      </label>
      <div className="relative min-w-0">
        <UserRound
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-brand-700"
        />
        <select
          id={id}
          value={activePatientId}
          onChange={onChange}
          disabled={!hydrated}
          aria-busy={!hydrated || undefined}
          className={cn(
            "min-h-11 w-full max-w-[11rem] appearance-none truncate rounded-control border border-border-strong bg-surface",
            "py-2 pr-8 pl-8 text-sm font-semibold text-ink sm:max-w-[16rem] lg:max-w-[20rem]",
            "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
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
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-ink-muted"
        />
      </div>
    </div>
  );
}
