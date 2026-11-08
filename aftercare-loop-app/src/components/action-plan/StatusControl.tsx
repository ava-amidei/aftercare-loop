"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CheckIcon, EllipsisHorizontalIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import type { ActionStatus } from "@/lib/types";
import { actionStatusKey, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

export interface StatusControlProps {
  value: ActionStatus;
  onChange: (status: ActionStatus) => void;
  /** Accessible name context, e.g. the action description. */
  itemLabel: string;
}

const PILL =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-[background-color,transform] motion-safe:active:scale-95 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary-700";

/**
 * One compact row (VALIDATION-REPORT fix 13): a "Done" toggle plus a small
 * "More" menu that holds "Needs Clarification". Pressed/checked state is
 * exposed with aria-pressed / aria-checked and a strong fill, so it is
 * readable without hue.
 */
export function StatusControl({ value, onChange, itemLabel }: StatusControlProps) {
  const t = useT();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRef = useRef<HTMLButtonElement>(null);

  const done = value === "completed";
  const clarify = value === "needs_clarification";
  const statusLabel = t("actionPlan.status.label");
  const clarifyLabel = t(actionStatusKey("needs_clarification"));

  useEffect(() => {
    if (!open) return;
    itemRef.current?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  return (
    <div
      ref={wrapRef}
      role="group"
      aria-label={`${statusLabel}: ${itemLabel}`}
      data-status-control={value}
      className="relative flex flex-wrap items-center gap-2"
    >
      <button
        type="button"
        aria-pressed={done}
        onClick={() => onChange(done ? "pending" : "completed")}
        className={cn(PILL, done ? "bg-success text-white" : "bg-gray-10 text-gray-80 hover:bg-gray-20")}
      >
        <CheckIcon aria-hidden="true" className="size-4" />
        {t("common.done")}
        <span className="sr-only">: {itemLabel}</span>
      </button>

      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={clarify ? `${statusLabel}: ${clarifyLabel}, ${itemLabel}` : `${statusLabel}: ${itemLabel}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          PILL,
          "min-w-11 justify-center",
          clarify ? "bg-warning text-white" : "px-2.5 text-gray-80 hover:bg-gray-10",
        )}
      >
        {clarify ? (
          <>
            <QuestionMarkCircleIcon aria-hidden="true" className="size-4" />
            <span aria-hidden="true">{clarifyLabel}</span>
          </>
        ) : (
          <EllipsisHorizontalIcon aria-hidden="true" className="size-5" />
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={statusLabel}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              close(true);
            } else if (e.key === "Tab") {
              close(false);
            }
          }}
          className="absolute top-full left-0 z-20 mt-1 min-w-48 rounded-2xl border border-gray-10 bg-gray-0 p-1 shadow-lg"
        >
          <button
            ref={itemRef}
            type="button"
            role="menuitemcheckbox"
            aria-checked={clarify}
            onClick={() => {
              onChange(clarify ? "pending" : "needs_clarification");
              close(true);
            }}
            className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold text-gray-90 hover:bg-gray-10 focus-visible:outline-3 focus-visible:outline-primary-700"
          >
            <QuestionMarkCircleIcon aria-hidden="true" className="size-4 shrink-0" />
            <span className="flex-1">{clarifyLabel}</span>
            {clarify && <CheckIcon aria-hidden="true" className="size-4 shrink-0" />}
          </button>
        </div>
      )}
    </div>
  );
}
