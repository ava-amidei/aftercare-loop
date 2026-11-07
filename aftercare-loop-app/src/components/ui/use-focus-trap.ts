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

/**
 * Active surfaces, innermost last. Keys are handled on `document` (so Esc and
 * Tab still work after the focused element unmounts and focus falls to
 * <body>), and only by the topmost surface so a nested dialog closes alone.
 */
const trapStack: object[] = [];

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

    const token = {};
    trapStack.push(token);

    function onKeyDown(event: KeyboardEvent) {
      if (!container || trapStack[trapStack.length - 1] !== token || event.defaultPrevented) return;
      const current = document.activeElement;
      const focusLost = !current || current === document.body;
      // A non-modal surface only reacts while focus is inside it (or was dropped).
      if (!trap && !focusLost && !container.contains(current)) return;
      if (event.key === "Escape") {
        if (onEscape) {
          event.stopPropagation();
          onEscape();
        }
        return;
      }
      if (!trap || event.key !== "Tab") return;
      const items = getFocusable(container);
      if (items.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !container.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const idx = trapStack.lastIndexOf(token);
      if (idx !== -1) trapStack.splice(idx, 1);
      if (lockScroll) document.body.style.overflow = prevOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === "function" && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
    // onEscape intentionally excluded: callers often pass inline closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, containerRef, initialFocusRef, trap, lockScroll]);
}
