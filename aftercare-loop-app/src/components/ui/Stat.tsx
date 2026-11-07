import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export const NOT_EVALUATED_LABEL = "Not evaluated";

export interface StatProps {
  label: ReactNode;
  /** Formatted value. `null`/`undefined` renders "Not evaluated" — never a made-up number. */
  value: ReactNode | null | undefined;
  /** Optional raw counts, rendered as "numerator / denominator". */
  numerator?: number | null;
  denominator?: number | null;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const toneClass = {
  default: "text-ink",
  success: "text-success-strong",
  warning: "text-warning-strong",
  danger: "text-danger-strong",
} as const;

export function Stat({ label, value, numerator, denominator, hint, icon, tone = "default", className }: StatProps) {
  const missing = value === null || value === undefined || value === "";
  const hasCounts = typeof numerator === "number" && typeof denominator === "number";
  return (
    <div className={cn("flex flex-col gap-1 rounded-card border border-border bg-surface p-4", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-ink-muted">
        {icon}
        <span>{label}</span>
      </div>
      {missing ? (
        <p className="text-lg font-semibold text-ink-subtle" data-testid="stat-value">
          {NOT_EVALUATED_LABEL}
        </p>
      ) : (
        <p className={cn("text-3xl font-bold tabular-nums", toneClass[tone])} data-testid="stat-value">
          {value}
        </p>
      )}
      {hasCounts && !missing && (
        <p className="text-sm text-ink-muted tabular-nums">
          {numerator} / {denominator}
        </p>
      )}
      {hint && <p className="text-sm text-ink-muted">{hint}</p>}
    </div>
  );
}
