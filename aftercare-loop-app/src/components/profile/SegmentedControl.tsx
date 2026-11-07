"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  hint?: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  legend: ReactNode;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  name?: string;
  className?: string;
}

/**
 * Single-choice segmented control built on native radio inputs (arrow keys,
 * screen readers and forms work out of the box). Each segment is >= 44px tall.
 */
export function SegmentedControl<T extends string>({
  legend,
  value,
  options,
  onChange,
  name,
  className,
}: SegmentedControlProps<T>) {
  const autoId = useId();
  const groupName = name ?? `seg-${autoId}`;
  const selected = options.find((o) => o.value === value);
  const hintId = `${groupName}-hint`;
  return (
    <fieldset className={cn("flex flex-col gap-2", className)} aria-describedby={selected?.hint ? hintId : undefined}>
      <legend className="mb-1.5 text-base font-medium text-ink">{legend}</legend>
      <div className="grid grid-cols-3 gap-1 rounded-control border border-border bg-surface-muted p-1">
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <label
              key={o.value}
              className={cn(
                "relative flex min-h-11 cursor-pointer items-center justify-center rounded-[0.6rem] px-2 text-center text-base font-medium",
                "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-brand-600",
                checked ? "bg-surface text-brand-800 shadow-sm" : "text-ink-muted hover:text-ink",
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          );
        })}
      </div>
      {selected?.hint && (
        <p id={hintId} className="text-sm text-ink-muted">
          {selected.hint}
        </p>
      )}
    </fieldset>
  );
}
