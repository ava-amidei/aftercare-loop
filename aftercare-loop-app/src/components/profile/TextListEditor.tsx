"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/20/solid";
import { Button } from "@/components/ui";
import { controlBase, controlState } from "@/components/ui/field";
import { useT } from "@/lib/i18n";
import type { ActionOrigin } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { containsText } from "./profile-draft";
import { ProfileOriginBadge } from "./ProfileOriginBadge";

export interface TextListEditorProps {
  /** Visible group label (used for item aria-labels too). */
  label: string;
  hint?: ReactNode;
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
  placeholder?: string;
  emptyText: string;
  /** Origin for each item (drives OriginBadge). */
  originFor: (item: string) => ActionOrigin;
  patientWording?: "entered" | "chosen";
}

/** Editable list of short text items: edit in place, remove, add new. */
export function TextListEditor({
  label,
  hint,
  items,
  onChange,
  addLabel,
  placeholder,
  emptyText,
  originFor,
  patientWording,
}: TextListEditorProps) {
  const t = useT();
  const baseId = useId();
  const [pending, setPending] = useState("");
  const addId = `${baseId}-add`;
  const hintId = hint ? `${baseId}-hint` : undefined;

  const add = () => {
    const value = pending.trim();
    if (!value || containsText(items, value)) {
      setPending("");
      return;
    }
    onChange([...items, value]);
    setPending("");
  };

  const onAddKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  return (
    <fieldset className="flex flex-col gap-3" aria-describedby={hintId}>
      <legend className="mb-1 text-base font-medium text-gray-90">{label}</legend>
      {hint && (
        <p id={hintId} className="-mt-2 text-sm text-gray-70">
          {hint}
        </p>
      )}
      {items.length === 0 ? (
        <p className="rounded-2xl bg-gray-5 px-3 py-3 text-base text-gray-70">
          {emptyText}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item, i) => {
            const itemLabel = t("profile.list.item", { label, number: i + 1 });
            return (
              <li key={i} className="flex flex-col gap-1.5 rounded-2xl bg-gray-5 p-2.5">
                <ProfileOriginBadge origin={originFor(item)} patientWording={patientWording} className="self-start" />
                <div className="flex items-start gap-2">
                  <input
                    type="text"
                    aria-label={itemLabel}
                    value={item}
                    onChange={(e) => onChange(items.map((v, j) => (j === i ? e.target.value : v)))}
                    className={cn(controlBase, controlState(false), "min-h-11 min-w-0 flex-1 px-3")}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("profile.list.remove", { item: item || itemLabel })}
                    onClick={() => onChange(items.filter((_, j) => j !== i))}
                  >
                    <TrashIcon aria-hidden="true" className="size-5" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={addId} className="text-sm font-medium text-gray-90">
          {addLabel}
        </label>
        <div className="flex gap-2">
          <input
            id={addId}
            type="text"
            value={pending}
            placeholder={placeholder}
            onChange={(e) => setPending(e.target.value)}
            onKeyDown={onAddKey}
            className={cn(controlBase, controlState(false), "min-h-11 min-w-0 flex-1 px-3")}
          />
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<PlusIcon aria-hidden="true" className="size-4" />}
            onClick={add}
            disabled={!pending.trim()}
            aria-label={`${t("profile.list.add")}: ${label}`}
          >
            {t("profile.list.add")}
          </Button>
        </div>
      </div>
    </fieldset>
  );
}
