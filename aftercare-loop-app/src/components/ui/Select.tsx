"use client";

import type { ReactNode, Ref, SelectHTMLAttributes } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils/cn";
import { Field, controlBase, controlState } from "./field";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Convenience alternative to <option> children. */
  options?: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
  ref?: Ref<HTMLSelectElement>;
}

/** Native <select> (best mobile + screen-reader support), styled. */
export function Select({
  label,
  hint,
  error,
  options,
  placeholder,
  wrapperClassName,
  className,
  id,
  required,
  children,
  ref,
  ...rest
}: SelectProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id} className={wrapperClassName}>
      {({ id: controlId, describedBy, invalid }) => (
        <div className="relative">
          <select
            ref={ref}
            id={controlId}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(controlBase, controlState(invalid), "min-h-12 appearance-none pr-10 pl-3.5", className)}
            {...rest}
          >
            {placeholder !== undefined && (
              <option value="" disabled={required}>
                {placeholder}
              </option>
            )}
            {options?.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
            {children}
          </select>
          <ChevronDownIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-gray-70"
          />
        </div>
      )}
    </Field>
  );
}
