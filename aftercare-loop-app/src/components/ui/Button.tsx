import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const base =
  // Labels wrap (never whitespace-nowrap) so long/translated labels stay inside
  // narrow mobile columns instead of widening the page; max-w-full caps the box.
  // DESIGN: pill shape, filled (never outlined), subtle scale on press.
  "inline-flex max-w-full items-center justify-center gap-2 rounded-full text-center leading-snug font-semibold select-none " +
  "transition-[background-color,color,transform] duration-150 motion-safe:active:scale-[0.97] " +
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary-700 " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 aria-disabled:cursor-not-allowed aria-disabled:opacity-60";

// Text on fills: gray-100 / *-contrast tokens (never white on #FBA17E or #FF9A00).
// primary: #141414 on #FBA17E 9.21:1, hover #141414 on #EE6200 5.60:1.
const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-contrast hover:bg-primary-strong hover:text-primary-strong-contrast active:bg-primary-strong active:text-primary-strong-contrast",
  // Filled neutral (gray-10), not outlined.
  secondary: "bg-gray-10 text-gray-90 hover:bg-gray-20 active:bg-gray-20",
  ghost: "bg-transparent text-gray-90 hover:bg-gray-10 active:bg-gray-20",
  // White on danger #B42318: 6.57:1.
  danger: "bg-danger text-white hover:bg-danger-strong",
  // Ask Kat accent #FF9A00 with gray-100 text: 8.66:1 (hover accent-600 7.02:1).
  accent: "bg-accent text-gray-100 hover:bg-accent-600 active:bg-accent-600",
};

// Every size keeps a >= 44px (h-11) touch target.
const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 py-2 text-sm",
  md: "min-h-12 px-5 py-2.5 text-base",
  lg: "min-h-14 px-6 py-3 text-lg",
  icon: "h-11 w-11 shrink-0 p-0 whitespace-nowrap",
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

/** Class string for button-styled elements (e.g. `<Link className={buttonVariants()}>`). */
export function buttonVariants({ variant = "primary", size = "md", fullWidth, className }: ButtonStyleOptions = {}) {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full", className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Shows a spinner, sets aria-busy and disables the button. */
  loading?: boolean;
  /** Visually-hidden text announced while loading (default "Loading"). */
  loadingLabel?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  loading = false,
  loadingLabel = "Loading",
  leftIcon,
  rightIcon,
  className,
  disabled,
  children,
  type = "button",
  ref,
  ...rest
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonVariants({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-variant={variant}
      {...rest}
    >
      {loading ? (
        <>
          <ArrowPathIcon aria-hidden="true" className="size-5 shrink-0 animate-spin" />
          <span className="sr-only">{loadingLabel}</span>
        </>
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
