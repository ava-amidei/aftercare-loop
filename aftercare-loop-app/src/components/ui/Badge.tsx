import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeVariant = "neutral" | "brand" | "accent" | "success" | "warning" | "danger" | "info";

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-surface-muted text-ink-muted border-border",
  brand: "bg-brand-50 text-brand-800 border-brand-200",
  accent: "bg-accent-50 text-accent-800 border-accent-200",
  success: "bg-success-soft text-success-strong border-success/30",
  warning: "bg-warning-soft text-warning-strong border-warning/30",
  danger: "bg-danger-soft text-danger-strong border-danger/30",
  info: "bg-info-soft text-info-strong border-info/30",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  icon?: ReactNode;
}

export function Badge({ variant = "neutral", size = "md", icon, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border font-medium leading-tight",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}
