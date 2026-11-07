"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface FieldProps {
  /** Visible label. Omit only when an external <label> or aria-label is provided. */
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  id?: string;
  className?: string;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

/** Wires label / hint / error to a control with correct ids and aria. */
export function Field({ label, hint, error, required, id, className, children }: FieldProps) {
  const autoId = useId();
  const controlId = id ?? `field-${autoId}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={controlId} className="text-base font-medium text-ink">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-danger">
              *
            </span>
          )}
        </label>
      )}
      {hint && (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {children({ id: controlId, describedBy, invalid: Boolean(error) })}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export const controlBase =
  "w-full rounded-control border bg-surface text-base text-ink placeholder:text-ink-subtle " +
  "transition-colors focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-brand-600 " +
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-subtle";

export function controlState(invalid: boolean) {
  return invalid ? "border-danger" : "border-border-strong hover:border-ink-muted";
}
