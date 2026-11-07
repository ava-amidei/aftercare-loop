"use client";

import type { QuickPromptId } from "@/lib/types";
import { QUICK_PROMPT_ORDER, quickPromptKey, type Translator } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

export interface KatSuggestionChipsProps {
  t: Translator;
  onSelect: (id: QuickPromptId) => void;
  disabled?: boolean;
  /** Compact single scrolling row (after the conversation has started). */
  compact?: boolean;
}

/** The five SPEC §12.1 suggestion chips, in spec order. */
export function KatSuggestionChips({ t, onSelect, disabled, compact }: KatSuggestionChipsProps) {
  return (
    <ul
      aria-label={compact ? t("askKat.moreSuggestions") : t("askKat.chips.label")}
      className={cn("flex gap-2", compact ? "-mx-1 overflow-x-auto px-1 pb-1" : "flex-wrap")}
    >
      {QUICK_PROMPT_ORDER.map((id) => (
        <li key={id} className="shrink-0">
          <button
            type="button"
            data-chip={id}
            disabled={disabled && id !== "free_text"}
            onClick={() => onSelect(id)}
            className={cn(
              "min-h-11 rounded-full border px-3.5 py-2 text-left text-sm font-medium transition-colors",
              "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
              "disabled:cursor-not-allowed disabled:opacity-60",
              id === "free_text"
                ? "border-dashed border-border-strong bg-surface text-ink-muted hover:bg-surface-muted"
                : "border-accent-200 bg-accent-50 text-accent-900 hover:border-accent-400 hover:bg-accent-100",
              compact && "whitespace-nowrap",
            )}
          >
            {t(quickPromptKey(id))}
          </button>
        </li>
      ))}
    </ul>
  );
}
