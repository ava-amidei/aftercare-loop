"use client";

import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils/cn";
import { Field, controlBase, controlState } from "./field";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "children"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Applied to the wrapper (label + control + messages). */
  wrapperClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

export function Input({ label, hint, error, wrapperClassName, className, id, required, ref, ...rest }: InputProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id} className={wrapperClassName}>
      {({ id: controlId, describedBy, invalid }) => (
        <input
          ref={ref}
          id={controlId}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(controlBase, controlState(invalid), "min-h-12 px-3.5", className)}
          {...rest}
        />
      )}
    </Field>
  );
}
