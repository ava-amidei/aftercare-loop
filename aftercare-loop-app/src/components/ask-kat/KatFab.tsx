"use client";

import type { Ref } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface KatFabProps {
  label: string;
  ariaLabel: string;
  onClick: () => void;
  /** Shows a small dot (minimized conversation or reply in flight). Mention it in ariaLabel. */
  indicator?: boolean;
  /** Profile preference; the OS setting is also respected via motion-safe. */
  reducedMotion?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

/** Chat-bubble icon with a small heart overlay (SPEC §12.1). */
export function KatIcon({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("relative inline-flex size-6 shrink-0", className)}>
      <MessageCircle className="size-6" strokeWidth={2.25} />
      <Heart
        className="absolute top-1/2 left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 fill-current"
        strokeWidth={2.5}
      />
    </span>
  );
}

/**
 * Floating "Ask Kat" button, bottom-right. Uses the shell's --kat-fab-bottom /
 * --kat-fab-right variables so it sits above the mobile bottom nav and the
 * safe-area inset, and at 1.5rem from the corner on desktop.
 */
export function KatFab({ label, ariaLabel, onClick, indicator, reducedMotion, ref }: KatFabProps) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      data-testid="kat-fab"
      style={{ bottom: "var(--kat-fab-bottom)", right: "var(--kat-fab-right)" }}
      className={cn(
        "fixed z-[45] inline-flex min-h-14 items-center gap-2 rounded-full bg-accent-700 py-3 pr-5 pl-4",
        "text-base font-semibold text-white shadow-lg ring-1 ring-black/5",
        "hover:bg-accent-800 hover:shadow-xl active:bg-accent-900",
        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
        !reducedMotion &&
          "motion-safe:transition-[transform,box-shadow,background-color] motion-safe:duration-200 motion-safe:hover:scale-105 motion-safe:active:scale-100",
      )}
    >
      <KatIcon />
      <span>{label}</span>
      {indicator && (
        <span
          aria-hidden="true"
          data-testid="kat-fab-indicator"
          className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-white"
        >
          <span className="size-2.5 rounded-full bg-brand-600" />
        </span>
      )}
    </button>
  );
}
