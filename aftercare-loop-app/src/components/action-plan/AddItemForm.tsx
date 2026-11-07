"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Button, Input } from "@/components/ui";

export interface AddItemFormProps {
  label: string;
  hint?: string;
  placeholder: string;
  submitLabel: string;
  requiredMessage: string;
  onAdd: (text: string) => void;
}

/** Single-line free-text add form (goals, questions). */
export function AddItemForm({ label, hint, placeholder, submitLabel, requiredMessage, onAdd }: AddItemFormProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = value.trim();
    if (!text) {
      setError(requiredMessage);
      return;
    }
    onAdd(text);
    setValue("");
    setError(null);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-end" noValidate>
      <Input
        label={label}
        hint={hint}
        placeholder={placeholder}
        value={value}
        maxLength={500}
        error={error ?? undefined}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(null);
        }}
        wrapperClassName="flex-1"
      />
      <Button type="submit" variant="secondary" leftIcon={<Plus aria-hidden="true" className="size-5" />}>
        {submitLabel}
      </Button>
    </form>
  );
}
