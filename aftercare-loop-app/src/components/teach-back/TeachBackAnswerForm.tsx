"use client";

import { useId, useState, type FormEvent } from "react";
import type { TeachBackQuestion } from "@/lib/types";
import { Button, Textarea } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";

export interface TeachBackAnswerFormProps {
  question: TeachBackQuestion;
  submitting: boolean;
  onSubmit: (response: string) => void;
}

/** Multiple-choice options (when defined) plus an always-available free-text answer. */
export function TeachBackAnswerForm({ question, submitting, onSubmit }: TeachBackAnswerFormProps) {
  const t = useT();
  const name = useId();
  const [choiceId, setChoiceId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const choices = question.choices ?? [];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const typed = text.trim();
    const choice = choices.find((c) => c.id === choiceId);
    const response = typed || choice?.text || "";
    if (!response) {
      setError(t("check.answerRequired"));
      return;
    }
    setError(null);
    onSubmit(response);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate aria-busy={submitting || undefined}>
      {choices.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-base font-medium text-gray-90">{t("check.chooseOne")}</legend>
          {choices.map((c) => {
            const checked = choiceId === c.id && !text.trim();
            return (
              <label
                key={c.id}
                className={cn(
                  "flex min-h-12 cursor-pointer items-start gap-3 rounded-2xl px-4 py-3 text-base transition-colors",
                  "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary-700",
                  checked
                    ? "bg-secondary font-medium text-gray-100"
                    : "bg-gray-5 text-gray-90 hover:bg-gray-10",
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={c.id}
                  checked={checked}
                  onChange={() => {
                    setChoiceId(c.id);
                    setText("");
                    setError(null);
                  }}
                  className="mt-1 size-4 shrink-0 accent-primary-700"
                />
                <span>{c.text}</span>
              </label>
            );
          })}
        </fieldset>
      )}
      <Textarea
        label={choices.length > 0 ? t("check.orTypeAnswer") : t("check.answerLabel")}
        placeholder={t("check.answerPlaceholder")}
        rows={3}
        maxLength={2000}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (e.target.value.trim()) setChoiceId(null);
          setError(null);
        }}
        error={error ?? undefined}
      />
      <div>
        <Button type="submit" loading={submitting} loadingLabel={t("check.checking")}>
          {t("check.submit")}
        </Button>
      </div>
    </form>
  );
}
