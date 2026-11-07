import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds hover affordance for clickable cards. */
  interactive?: boolean;
  tone?: "default" | "muted" | "brand" | "accent";
  padding?: "none" | "sm" | "md" | "lg";
}

const tones = {
  default: "bg-surface border-border",
  muted: "bg-surface-muted border-border",
  brand: "bg-brand-50 border-brand-200",
  accent: "bg-accent-50 border-accent-200",
} as const;

const paddings = { none: "", sm: "p-3", md: "p-4 sm:p-5", lg: "p-5 sm:p-7" } as const;

export function Card({ interactive, tone = "default", padding = "md", className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border shadow-[0_1px_2px_rgba(28,25,23,0.04)]",
        tones[tone],
        paddings[padding],
        interactive && "transition-shadow hover:shadow-md hover:border-brand-300",
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3 flex flex-col gap-1", className)} {...rest} />;
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: "h2" | "h3" | "h4";
}

export function CardTitle({ as: Tag = "h2", className, ...rest }: CardTitleProps) {
  return <Tag className={cn("text-lg font-semibold text-ink", className)} {...rest} />;
}

export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-base text-ink-muted", className)} {...rest} />;
}

export function CardContent({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-3", className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex flex-wrap items-center gap-3", className)} {...rest} />;
}
