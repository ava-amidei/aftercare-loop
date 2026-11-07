"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { cn } from "@/lib/utils/cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

/** Native checkbox with a full-row (>= 44px) clickable label. */
export function Checkbox({ label, description, id, className, disabled, ref, ...rest }: CheckboxProps) {
  const autoId = useId();
  const controlId = id ?? `cb-${autoId}`;
  const descId = description ? `${controlId}-desc` : undefined;
  return (
    <label
      htmlFor={controlId}
      className={cn(
        "flex min-h-11 items-start gap-3 rounded-control py-2.5 pr-2",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      )}
    >
      <input
        ref={ref}
        id={controlId}
        type="checkbox"
        disabled={disabled}
        aria-describedby={descId}
        className="mt-0.5 size-5 shrink-0 cursor-[inherit] rounded accent-brand-700"
        {...rest}
      />
      <span className="flex flex-col">
        <span className="text-base text-ink">{label}</span>
        {description && (
          <span id={descId} className="text-sm text-ink-muted">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
