"use client";

import { useId } from "react";
import { CheckIcon, EllipsisHorizontalCircleIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import type { ActionStatus } from "@/lib/types";
import { actionStatusKey, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

const STATUSES: ActionStatus[] = ["pending", "completed", "needs_clarification"];
const ICONS = { pending: EllipsisHorizontalCircleIcon, completed: CheckIcon, needs_clarification: QuestionMarkCircleIcon } as const;
const ACTIVE: Record<ActionStatus, string> = {
  // Selected = strong fill (unselected is light gray): readable without hue.
  pending: "bg-primary text-primary-contrast",
  completed: "bg-success text-white", // 5.36:1
  needs_clarification: "bg-warning text-white", // 6.22:1
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
      <legend className="mb-1 text-sm font-medium text-gray-70">
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
                "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-[background-color,transform] motion-safe:active:scale-95",
                "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-700",
                checked ? ACTIVE[s] : "bg-gray-10 text-gray-80 hover:bg-gray-20",
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
