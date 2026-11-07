"use client";

import { useEffect, useRef } from "react";
import type { ActionItem, PatientId } from "@/lib/types";
import { useToast } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { formatDateTime } from "@/lib/utils/dates";
import { dueReminders } from "./plan-logic";

/**
 * Lightweight in-app reminder: once per mount (per patient), when ready, show a
 * single toast for the earliest active reminder due within the next 24 hours.
 */
export function useDueReminderToast(patientId: PatientId, actions: ActionItem[], ready: boolean): void {
  const { toast } = useToast();
  const t = useT();
  const shownFor = useRef<PatientId | null>(null);

  useEffect(() => {
    if (!ready || shownFor.current === patientId) return;
    shownFor.current = patientId;
    const [first] = dueReminders(actions);
    if (!first) return;
    toast({
      title: t("actionPlan.reminder.dueTitle", { label: first.reminder.label }),
      description: t("actionPlan.reminder.dueBody", { date: formatDateTime(first.reminder.at, t.lang) }),
      variant: "info",
      duration: 8000,
    });
    // Only re-run when the patient or readiness changes, not on every action edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, patientId]);
}
