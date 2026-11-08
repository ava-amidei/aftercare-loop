import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds hover affordance for clickable cards. */
  interactive?: boolean;
  tone?: "default" | "muted" | "brand" | "accent";
  padding?: "none" | "sm" | "md" | "lg";
}

// DESIGN: filled surfaces, no borders, flat (no shadow). The page canvas is
// gray-5, so default cards are gray-0; muted cards sit one step darker.
const tones = {
  default: "bg-gray-0",
  muted: "bg-gray-10",
  brand: "bg-primary-50",
  accent: "bg-accent-50",
} as const;

const paddings = { none: "", sm: "p-3", md: "p-4 sm:p-5", lg: "p-5 sm:p-7" } as const;

export function Card({ interactive, tone = "default", padding = "md", className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl",
        tones[tone],
        paddings[padding],
        interactive && "transition-[background-color,transform] hover:bg-primary-50 motion-safe:active:scale-[0.99]",
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
  return <Tag className={cn("text-lg font-bold text-gray-90", className)} {...rest} />;
}

export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-base text-gray-70", className)} {...rest} />;
}

export function CardContent({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-3", className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex flex-wrap items-center gap-3", className)} {...rest} />;
}
