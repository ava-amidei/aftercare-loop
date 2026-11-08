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
  default: "text-gray-90",
  success: "text-success-strong",
  warning: "text-warning-strong",
  danger: "text-danger-strong",
} as const;

export function Stat({ label, value, numerator, denominator, hint, icon, tone = "default", className }: StatProps) {
  const missing = value === null || value === undefined || value === "";
  const hasCounts = typeof numerator === "number" && typeof denominator === "number";
  return (
    <div className={cn("flex flex-col gap-1 rounded-3xl bg-gray-0 p-4", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-70">
        {icon}
        <span>{label}</span>
      </div>
      {missing ? (
        <p className="text-lg font-semibold text-gray-60" data-testid="stat-value">
          {NOT_EVALUATED_LABEL}
        </p>
      ) : (
        <p className={cn("text-3xl font-bold tabular-nums", toneClass[tone])} data-testid="stat-value">
          {value}
        </p>
      )}
      {hasCounts && !missing && (
        <p className="text-sm text-gray-70 tabular-nums">
          {numerator} / {denominator}
        </p>
      )}
      {hint && <p className="text-sm text-gray-70">{hint}</p>}
    </div>
  );
}
