"use client";

import { useId, useState, type KeyboardEvent } from "react";
import { CheckIcon, PlusIcon } from "@heroicons/react/20/solid";
import { Button } from "@/components/ui";
import { controlBase, controlState } from "@/components/ui/field";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import { containsText } from "./profile-draft";

export interface ConditionChipsProps {
  /** Currently selected labels (free text; condition-agnostic). */
  selected: string[];
  /** All chip options (selected ones included). */
  options: string[];
  onChange: (selected: string[]) => void;
}

/** Multi-select chips (toggle buttons) + free-text "add your own". */
export function ConditionChips({ selected, options, onChange }: ConditionChipsProps) {
  const t = useT();
  const baseId = useId();
  const [pending, setPending] = useState("");
  const addId = `${baseId}-add`;
  const hintId = `${baseId}-hint`;

  const isSelected = (label: string) => containsText(selected, label);
  const toggle = (label: string) =>
    onChange(isSelected(label) ? selected.filter((s) => !containsText([label], s)) : [...selected, label]);

  const add = () => {
    const value = pending.replace(/\s+/g, " ").trim();
    setPending("");
    if (!value || isSelected(value)) return;
    // Reuse an existing option's spelling when it matches case-insensitively.
    const existing = options.find((o) => containsText([o], value));
    onChange([...selected, existing ?? value]);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  return (
    <fieldset className="flex flex-col gap-3" aria-describedby={hintId}>
      <legend className="mb-1 text-base font-medium text-gray-90">{t("profile.field.conditions")}</legend>
      <p id={hintId} className="-mt-2 text-sm text-gray-70">
        {t("profile.field.conditionsHint")}{" "}
        <span aria-live="polite">{t("profile.conditions.selectedCount", { count: selected.length })}</span>
      </p>
      {options.length === 0 ? (
        <p className="text-base text-gray-70">{t("profile.conditions.empty")}</p>
      ) : (
        <ul aria-label={t("profile.conditions.options")} className="flex flex-wrap gap-2">
          {options.map((label) => {
            const on = isSelected(label);
            return (
              <li key={label}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(label)}
                  className={cn(
                    "inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full px-4 text-left text-base font-medium transition-[background-color,transform] motion-safe:active:scale-95",
                    on
                      ? "bg-secondary font-semibold text-gray-100 hover:bg-secondary-200"
                      : "bg-gray-10 text-gray-90 hover:bg-gray-20",
                  )}
                >
                  {on && <CheckIcon aria-hidden="true" className="size-4 shrink-0" />}
                  <span className="break-words">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {selected.length === 0 && options.length > 0 && (
        <p className="text-sm text-gray-70">{t("profile.conditions.empty")}</p>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={addId} className="text-sm font-medium text-gray-90">
          {t("profile.conditions.addLabel")}
        </label>
        <div className="flex gap-2">
          <input
            id={addId}
            type="text"
            value={pending}
            placeholder={t("profile.field.conditionsPlaceholder")}
            onChange={(e) => setPending(e.target.value)}
            onKeyDown={onKey}
            className={cn(controlBase, controlState(false), "min-h-11 min-w-0 flex-1 px-3")}
          />
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<PlusIcon aria-hidden="true" className="size-4" />}
            onClick={add}
            disabled={!pending.trim()}
          >
            {t("profile.conditions.add")}
          </Button>
        </div>
      </div>
    </fieldset>
  );
}
