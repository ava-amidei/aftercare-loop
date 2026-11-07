"use client";

import { useState, type FormEvent } from "react";
import type { ActionItem, Reminder } from "@/lib/types";
import { Button, Dialog, Input } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { dateTimeLocalToIso, toDateTimeLocalValue } from "./plan-logic";

export interface ReminderDialogProps {
  action: ActionItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (reminder: Reminder) => void;
}

function defaultWhen(action: ActionItem): string {
  if (action.reminder && !action.reminder.dismissed) {
    const d = new Date(action.reminder.at);
    if (!Number.isNaN(d.getTime())) return toDateTimeLocalValue(d);
  }
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return toDateTimeLocalValue(d);
}

/** Date-time picker for an in-app reminder (no SMS / email / push in the MVP). */
export function ReminderDialog({ action, open, onOpenChange, onSave }: ReminderDialogProps) {
  const t = useT();
  const [when, setWhen] = useState(() => defaultWhen(action));
  const [label, setLabel] = useState(() => action.reminder?.label ?? action.description);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const at = dateTimeLocalToIso(when);
    if (!at) {
      setError(t("actionPlan.reminder.invalid"));
      return;
    }
    onSave({ at, label: label.trim() || action.description, dismissed: false });
    onOpenChange(false);
  };

  const formId = `reminder-form-${action.id}`;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("actionPlan.reminder.title")}
      description={t("actionPlan.reminder.inAppOnly")}
      closeLabel={t("common.close")}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form={formId}>
            {t("actionPlan.reminder.save")}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Input
          type="datetime-local"
          label={t("actionPlan.reminder.when")}
          value={when}
          onChange={(e) => {
            setWhen(e.target.value);
            setError(null);
          }}
          error={error ?? undefined}
          required
        />
        <Input
          label={t("actionPlan.reminder.labelField")}
          value={label}
          maxLength={300}
          onChange={(e) => setLabel(e.target.value)}
        />
      </form>
    </Dialog>
  );
}
