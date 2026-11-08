"use client";

import { useId, useRef, type ReactNode, type RefObject } from "react";
import { XMarkIcon } from "@heroicons/react/20/solid";
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
            className="absolute inset-0 animate-fade-in bg-gray-100/40"
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
            // Mobile: bottom sheet with rounded top corners; desktop: side panel.
            "pointer-events-auto fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] bottom-0 z-10 flex animate-slide-up flex-col overflow-hidden rounded-t-[var(--radius-sheet)] bg-gray-0 shadow-float",
            "pb-[env(safe-area-inset-bottom)]",
            "md:inset-y-0 md:top-0 md:w-[min(28rem,100vw)] md:animate-slide-in-right md:rounded-none md:pt-0 md:pb-0",
            side === "right" ? "md:right-0 md:left-auto md:rounded-l-3xl" : "md:right-auto md:left-0 md:rounded-r-3xl",
            className,
          )}
        >
          <div className="flex items-center gap-3 border-b border-gray-10 px-4 py-3">
            {headerIcon}
            <div className="flex min-w-0 flex-1 flex-col">
              <h2 id={titleId} className="truncate text-lg font-semibold text-gray-90">
                {title}
              </h2>
              {description && (
                <p id={descId} className="text-sm text-gray-70">
                  {description}
                </p>
              )}
            </div>
            {headerActions}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={closeLabel}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-gray-70 hover:bg-gray-10 hover:text-gray-90"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className={cn("min-h-0 flex-1 overflow-y-auto px-4 py-4", bodyClassName)}>{children}</div>
          {footer && <div className="border-t border-gray-10 px-4 py-3">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}
