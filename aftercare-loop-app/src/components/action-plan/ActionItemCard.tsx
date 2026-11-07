"use client";

import { useState } from "react";
import { BellPlus, BellRing, CalendarClock, FileSearch, X } from "lucide-react";
import type { ActionItem, ActionStatus, Reminder } from "@/lib/types";
import { Badge, Button, Card, OriginBadge } from "@/components/ui";
import { actionTypeKey, originKey, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatDateTime } from "@/lib/utils/dates";
import { ACTION_TYPE_ICONS } from "./action-icons";
import { ReminderDialog } from "./ReminderDialog";
import { StatusControl } from "./StatusControl";

export interface ActionItemCardProps {
  action: ActionItem;
  /** Opens the SourceViewer for verified clinician-documented items. */
  onViewSource?: () => void;
  onStatusChange: (status: ActionStatus) => void;
  onReminderChange: (reminder: Reminder) => void;
  /** Hide the status control (e.g. for read-only suggestions). */
  hideStatus?: boolean;
  className?: string;
}

export function ActionItemCard({
  action,
  onViewSource,
  onStatusChange,
  onReminderChange,
  hideStatus,
  className,
}: ActionItemCardProps) {
  const t = useT();
  const lang = t.lang;
  const [reminderOpen, setReminderOpen] = useState(false);
  const Icon = ACTION_TYPE_ICONS[action.type] ?? ACTION_TYPE_ICONS.other;
  const canViewSource =
    action.origin === "clinician_documented" &&
    action.sourceVerification === "verified" &&
    !!action.sourceRef &&
    !!onViewSource;
  const reminder = action.reminder && !action.reminder.dismissed ? action.reminder : undefined;
  const dueLabel = action.dueDate ? formatDate(action.dueDate, lang) || action.dueDate : null;

  return (
    <Card
      data-testid="action-card"
      data-action-id={action.id}
      data-status={action.status}
      className={cn(action.status === "completed" && "bg-surface-muted", className)}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-700"
          title={t(actionTypeKey(action.type))}
        >
          <Icon aria-hidden="true" className="size-5" />
          <span className="sr-only">{t(actionTypeKey(action.type))}</span>
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <OriginBadge origin={action.origin} label={t(originKey(action.origin))} size="sm" />
            <Badge size="sm">{t(actionTypeKey(action.type))}</Badge>
          </div>
          <h4
            className={cn(
              "text-lg leading-snug font-semibold break-words text-ink",
              action.status === "completed" && "text-ink-muted line-through decoration-1",
            )}
          >
            {action.description}
          </h4>
          <dl className="flex flex-col gap-1 text-base">
            <div>
              <dt className="sr-only">{t("actionPlan.field.rationale")}</dt>
              <dd className="text-ink-muted">{action.rationale}</dd>
            </div>
            {action.category === "care_plan" && (
              <div className="flex items-center gap-1.5 text-sm">
                <CalendarClock aria-hidden="true" className="size-4 text-ink-muted" />
                <dt className="font-medium text-ink">{t("actionPlan.field.dueDate")}:</dt>
                <dd className="text-ink-muted">{dueLabel ?? t("actionPlan.field.noDueDate")}</dd>
              </div>
            )}
            {action.category !== "care_plan" && dueLabel && (
              <div className="flex items-center gap-1.5 text-sm">
                <CalendarClock aria-hidden="true" className="size-4 text-ink-muted" />
                <dt className="font-medium text-ink">{t("actionPlan.field.dueDate")}:</dt>
                <dd className="text-ink-muted">{dueLabel}</dd>
              </div>
            )}
          </dl>

          {reminder && (
            <div className="flex flex-wrap items-center gap-1">
              <span
                data-testid="reminder-chip"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-info/30 bg-info-soft px-3 text-sm font-medium text-info-strong"
              >
                <BellRing aria-hidden="true" className="size-4" />
                {t("actionPlan.reminder.set", { date: formatDateTime(reminder.at, lang) })}
              </span>
              <button
                type="button"
                onClick={() => onReminderChange({ ...reminder, dismissed: true })}
                aria-label={t("actionPlan.reminder.dismiss")}
                className="inline-flex size-11 items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          )}

          {!hideStatus && (
            <StatusControl value={action.status} onChange={onStatusChange} itemLabel={action.description} />
          )}

          <div className="flex flex-wrap gap-2">
            {canViewSource && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<FileSearch aria-hidden="true" className="size-4" />}
                onClick={onViewSource}
              >
                {t("common.viewSource")}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<BellPlus aria-hidden="true" className="size-4" />}
              onClick={() => setReminderOpen(true)}
            >
              {reminder ? t("actionPlan.reminder.change") : t("actionPlan.reminder.add")}
            </Button>
          </div>
        </div>
      </div>
      {reminderOpen && (
        <ReminderDialog
          action={action}
          open={reminderOpen}
          onOpenChange={setReminderOpen}
          onSave={onReminderChange}
        />
      )}
    </Card>
  );
}
