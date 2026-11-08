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
        <label htmlFor={controlId} className="text-base font-medium text-gray-90">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-danger">
              *
            </span>
          )}
        </label>
      )}
      {hint && (
        <p id={hintId} className="text-sm text-gray-70">
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

// DESIGN: inputs are filled gray-5 (no outline) with a primary focus ring.
// The ring is primary-700 (>= 3.37:1 on white/gray-5 for every accent preset).
export const controlBase =
  "w-full rounded-2xl bg-gray-5 text-base text-gray-90 placeholder:text-gray-60 " +
  "transition-[background-color,box-shadow] focus-visible:bg-gray-0 focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-primary-700 " +
  "disabled:cursor-not-allowed disabled:bg-gray-10 disabled:text-gray-60";

/** Invalid: inset danger ring (an error cue, not a decorative outline). */
export function controlState(invalid: boolean) {
  return invalid ? "bg-danger-soft ring-2 ring-inset ring-danger" : "hover:bg-gray-10";
}
