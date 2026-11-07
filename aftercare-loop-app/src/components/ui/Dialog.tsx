"use client";

import { useId, useRef, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Portal } from "./Portal";
import { useFocusTrap } from "./use-focus-trap";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Action row (e.g. Cancel / Confirm buttons). */
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Close when the backdrop is clicked (default true). */
  dismissOnBackdrop?: boolean;
  closeLabel?: string;
  className?: string;
}

const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" } as const;

/** Modal dialog: focus trap, Esc to close, focus restore, scroll lock, labelled by its title. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  initialFocusRef,
  dismissOnBackdrop = true,
  closeLabel = "Close",
  className,
}: DialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useFocusTrap(ref, { active: open, initialFocusRef, onEscape: () => onOpenChange(false) });

  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          aria-hidden="true"
          data-testid="dialog-backdrop"
          className="absolute inset-0 animate-fade-in bg-stone-900/50"
          onClick={() => dismissOnBackdrop && onOpenChange(false)}
        />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
          className={cn(
            "relative z-10 flex max-h-[90dvh] w-full animate-scale-in flex-col overflow-hidden rounded-t-card bg-surface shadow-xl sm:rounded-card",
            sizes[size],
            className,
          )}
        >
          <div className="flex items-start gap-3 border-b border-border px-5 py-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2 id={titleId} className="text-xl font-semibold text-ink">
                {title}
              </h2>
              {description && (
                <p id={descId} className="text-base text-ink-muted">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={closeLabel}
              className="-mt-1 -mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted hover:text-ink"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          {children && <div className="overflow-y-auto px-5 py-4">{children}</div>}
          {footer && (
            <div className="flex flex-wrap justify-end gap-3 border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
