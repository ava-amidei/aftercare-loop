"use client";

import { useId } from "react";
import { Check, Circle, HelpCircle } from "lucide-react";
import type { ActionStatus } from "@/lib/types";
import { actionStatusKey, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

const STATUSES: ActionStatus[] = ["pending", "completed", "needs_clarification"];
const ICONS = { pending: Circle, completed: Check, needs_clarification: HelpCircle } as const;
const ACTIVE: Record<ActionStatus, string> = {
  pending: "border-brand-600 bg-brand-50 text-brand-800",
  completed: "border-success bg-success-soft text-success-strong",
  needs_clarification: "border-warning bg-warning-soft text-warning-strong",
};

export interface StatusControlProps {
  value: ActionStatus;
  onChange: (status: ActionStatus) => void;
  /** Accessible name context, e.g. the action description. */
  itemLabel: string;
}

/** Native radio group styled as pills: Pending / Completed / Needs clarification. */
export function StatusControl({ value, onChange, itemLabel }: StatusControlProps) {
  const t = useT();
  const name = useId();
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1 text-sm font-medium text-ink-muted">
        {t("actionPlan.status.label")}
        <span className="sr-only">: {itemLabel}</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const Icon = ICONS[s];
          const checked = value === s;
          return (
            <label
              key={s}
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm font-semibold",
                "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600",
                checked ? ACTIVE[s] : "border-border-strong bg-surface text-ink-muted hover:bg-surface-muted",
              )}
            >
              <input
                type="radio"
                name={name}
                value={s}
                checked={checked}
                onChange={() => onChange(s)}
                className="sr-only"
              />
              <Icon aria-hidden="true" className="size-4" />
              {t(actionStatusKey(s))}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
