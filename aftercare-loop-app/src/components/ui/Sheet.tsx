"use client";

import { useId, useRef, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Portal } from "./Portal";
import { useFocusTrap } from "./use-focus-trap";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Extra header controls rendered before the close button (e.g. a minimize button). */
  headerActions?: ReactNode;
  /** Optional element shown before the title (logo / avatar). */
  headerIcon?: ReactNode;
  /** Desktop side. Mobile is always a full-height sheet. */
  side?: "right" | "left";
  /**
   * Modal (default): backdrop, focus trap, scroll lock. Non-modal: the desktop
   * panel leaves the page interactive (Esc still closes, focus still restores).
   */
  modal?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  closeLabel?: string;
  className?: string;
  /** Classes for the scrollable body. */
  bodyClassName?: string;
}

/**
 * Side panel on desktop (md+) and full-height sheet on mobile.
 * Used by Ask Kat and any secondary detail view (e.g. "View source").
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  headerActions,
  headerIcon,
  side = "right",
  modal = true,
  initialFocusRef,
  closeLabel = "Close",
  className,
  bodyClassName,
}: SheetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  useFocusTrap(ref, {
    active: open,
    initialFocusRef,
    onEscape: () => onOpenChange(false),
    trap: modal,
    lockScroll: modal,
  });

  if (!open) return null;
  return (
    <Portal>
      <div className={cn("fixed inset-0 z-50", !modal && "pointer-events-none md:inset-auto")}>
        {modal && (
          <div
            aria-hidden="true"
            data-testid="sheet-backdrop"
            className="absolute inset-0 animate-fade-in bg-stone-900/40"
            onClick={() => onOpenChange(false)}
          />
        )}
        <div
          ref={ref}
          role="dialog"
          aria-modal={modal || undefined}
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          tabIndex={-1}
          className={cn(
            "pointer-events-auto fixed inset-0 z-10 flex animate-slide-up flex-col bg-surface shadow-2xl",
            "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
            "md:inset-y-0 md:w-[min(28rem,100vw)] md:animate-slide-in-right md:border-border md:pt-0 md:pb-0",
            side === "right" ? "md:right-0 md:left-auto md:border-l" : "md:right-auto md:left-0 md:border-r",
            className,
          )}
        >
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            {headerIcon}
            <div className="flex min-w-0 flex-1 flex-col">
              <h2 id={titleId} className="truncate text-lg font-semibold text-ink">
                {title}
              </h2>
              {description && (
                <p id={descId} className="text-sm text-ink-muted">
                  {description}
                </p>
              )}
            </div>
            {headerActions}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={closeLabel}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted hover:text-ink"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-4", bodyClassName)}>{children}</div>
          {footer && <div className="border-t border-border px-4 py-3">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}
