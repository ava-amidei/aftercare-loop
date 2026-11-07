"use client";

import { TriangleAlert } from "lucide-react";
import type { ActionItem, ActionStatus } from "@/lib/types";
import { Card, OriginBadge } from "@/components/ui";
import { originKey, useT } from "@/lib/i18n";
import { StatusControl } from "./StatusControl";

export interface NeedsClarificationProps {
  items: ActionItem[];
  onStatusChange: (item: ActionItem, status: ActionStatus) => void;
}

/**
 * Items that could not be matched word-for-word to the visit document
 * (ARCHITECTURE §2.5). Never shown as verified instructions.
 */
export function NeedsClarification({ items, onStatusChange }: NeedsClarificationProps) {
  const t = useT();
  if (items.length === 0) return null;
  return (
    <section
      aria-labelledby="needs-clarification-title"
      data-testid="needs-clarification"
      className="flex flex-col gap-3 rounded-card border border-warning/40 bg-warning-soft/50 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <TriangleAlert aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-warning" />
        <div className="flex flex-col gap-1">
          <h3 id="needs-clarification-title" className="text-lg font-semibold text-ink">
            {t("actionPlan.needsClarification.title")}
          </h3>
          <p className="text-base text-ink">
            <span className="font-semibold">{t("actionPlan.needsClarification.what")}: </span>
            {t("actionPlan.needsClarification.explainer")}
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.id}>
            <Card padding="sm" className="flex flex-col gap-2" data-testid="clarification-card">
              <OriginBadge origin={item.origin} label={t(originKey(item.origin))} size="sm" />
              <p className="text-sm font-medium text-warning-strong">
                {t("common.verification.unverified")}
              </p>
              <p className="text-base font-semibold break-words text-ink">{item.description}</p>
              <p className="text-sm text-ink-muted">{item.rationale}</p>
              <StatusControl
                value={item.status}
                onChange={(s) => onStatusChange(item, s)}
                itemLabel={item.description}
              />
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
