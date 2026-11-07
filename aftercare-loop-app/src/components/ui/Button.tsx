import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap select-none " +
  "transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-600 " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 shadow-sm",
  secondary:
    "bg-surface text-brand-800 border border-border-strong hover:bg-brand-50 hover:border-brand-600 active:bg-brand-100",
  ghost: "bg-transparent text-ink hover:bg-surface-muted active:bg-border",
  danger: "bg-danger text-white hover:bg-danger-strong shadow-sm",
  accent: "bg-accent-700 text-white hover:bg-accent-800 active:bg-accent-900 shadow-sm",
};

// Every size keeps a >= 44px (h-11) touch target.
const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3 text-sm",
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-6 text-lg",
  icon: "h-11 w-11 p-0",
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
          <LoaderCircle aria-hidden="true" className="size-5 shrink-0 animate-spin" />
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
