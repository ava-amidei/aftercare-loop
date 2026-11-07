"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute("inert") && el.getAttribute("aria-hidden") !== "true",
  );
}

export interface FocusTrapOptions {
  active: boolean;
  /** Element to focus on activation; defaults to the first focusable, then the container. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Called on Escape. */
  onEscape?: () => void;
  /** Trap Tab inside the container (modal). When false only Esc + focus restore apply. */
  trap?: boolean;
  /** Lock page scroll while active. */
  lockScroll?: boolean;
}

/** Focus management for modal surfaces: initial focus, Tab cycling, Esc, focus restore. */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  { active, initialFocusRef, onEscape, trap = true, lockScroll = true }: FocusTrapOptions,
) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const target = initialFocusRef?.current ?? getFocusable(container)[0] ?? container;
    target.focus({ preventScroll: true });

    const prevOverflow = document.body.style.overflow;
    if (lockScroll) document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (onEscape) {
          event.stopPropagation();
          onEscape();
        }
        return;
      }
      if (!trap || event.key !== "Tab" || !container) return;
      const items = getFocusable(container);
      if (items.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !container.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    }

    container.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("keydown", onKeyDown);
      if (lockScroll) document.body.style.overflow = prevOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === "function" && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
    // onEscape intentionally excluded: callers often pass inline closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, containerRef, initialFocusRef, trap, lockScroll]);
}
