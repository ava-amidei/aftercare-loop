"use client";

import type { Ref } from "react";
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";
import { HeartIcon } from "@heroicons/react/24/solid";
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

/**
 * Chat-bubble icon with a small heart overlay (SPEC §12.1): Heroicons
 * ChatBubbleOvalLeftEllipsis (outline) + a solid HeartIcon badge.
 */
export function KatIcon({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("relative inline-flex size-6 shrink-0", className)}>
      <ChatBubbleOvalLeftEllipsisIcon className="size-6" strokeWidth={1.75} />
      <HeartIcon className="absolute -top-1 -right-1.5 size-3.5" />
    </span>
  );
}

/**
 * Floating "Ask Kat" button, bottom-right. Uses the shell's --kat-fab-bottom /
 * --kat-fab-right variables so it sits above the mobile bottom nav and the
 * safe-area inset, and at 1.5rem from the corner on desktop. Icon-only below
 * md (label kept for assistive tech); globals.css pads <main> so content can
 * always scroll clear of it.
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
        // Icon-only 56px circle below md so it covers as little content as possible
        // (SPEC §12.1); the labelled pill from md up. aria-label names it either way.
        "fixed z-[45] inline-flex size-14 items-center justify-center rounded-full bg-accent",
        "md:size-auto md:min-h-14 md:justify-start md:gap-2 md:py-3 md:pr-5 md:pl-4",
        // Accent #FF9A00 with gray-100 text/icon: 8.66:1 (white would be 2.13:1).
        "text-base font-bold text-gray-100 shadow-float",
        "hover:bg-accent-600 active:bg-accent-600",
        "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary-700",
        !reducedMotion &&
          "motion-safe:transition-[transform,background-color] motion-safe:duration-200 motion-safe:hover:scale-105 motion-safe:active:scale-95",
      )}
    >
      <KatIcon />
      <span data-testid="kat-fab-label" className="sr-only md:not-sr-only">
        {label}
      </span>
      {indicator && (
        <span
          aria-hidden="true"
          data-testid="kat-fab-indicator"
          className="absolute -top-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-gray-0"
        >
          <span className="size-2.5 rounded-full bg-primary-700" />
        </span>
      )}
    </button>
  );
}
