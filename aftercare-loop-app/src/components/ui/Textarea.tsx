"use client";

import type { ReactNode, Ref, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { Field, controlBase, controlState } from "./field";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  wrapperClassName?: string;
  ref?: Ref<HTMLTextAreaElement>;
}

export function Textarea({
  label,
  hint,
  error,
  wrapperClassName,
  className,
  id,
  required,
  rows = 5,
  ref,
  ...rest
}: TextareaProps) {
  return (
    <Field label={label} hint={hint} error={error} required={required} id={id} className={wrapperClassName}>
      {({ id: controlId, describedBy, invalid }) => (
        <textarea
          ref={ref}
          id={controlId}
          rows={rows}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(controlBase, controlState(invalid), "min-h-24 px-3.5 py-3 leading-relaxed", className)}
          {...rest}
        />
      )}
    </Field>
  );
}
