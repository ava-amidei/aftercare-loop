"use client";

import Link from "next/link";
import { Bell, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { OriginBadge } from "@/components/ui/OriginBadge";
import { originKey, useT } from "@/lib/i18n";
import { formatDate, formatDateTime, formatRelativeDay, isDateOnly } from "@/lib/utils/dates";
import type { UpcomingItem } from "./dashboard-data";
import { InlineEmpty, SectionCard } from "./SectionCard";

const MAX_VISIBLE = 5;

/** Today's reminders and upcoming due dates, soonest first. */
export function UpcomingList({ items, now }: { items: UpcomingItem[]; now: Date }) {
  const t = useT();
  const lang = t.lang;
  const visible = items.slice(0, MAX_VISIBLE);
  return (
    <SectionCard
      id="dashboard-upcoming"
      title={t("dashboard.upcoming.title")}
      icon={<CalendarClock aria-hidden="true" className="size-5" />}
    >
      {visible.length === 0 ? (
        <InlineEmpty
          action={
            <Link
              href="/action-plan"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline underline-offset-4"
            >
              {t("dashboard.tasks.viewPlan")}
            </Link>
          }
        >
          {t("dashboard.upcoming.empty")}
        </InlineEmpty>
      ) : (
        <ol className="flex flex-col gap-2">
          {visible.map((item) => {
            const when = isDateOnly(item.at) ? formatDate(item.at, lang) : formatDateTime(item.at, lang);
            const label = item.kind === "reminder" ? item.action.reminder?.label || item.action.description : item.action.description;
            return (
              <li
                key={`${item.action.id}-${item.kind}`}
                data-testid="upcoming-item"
                className="flex flex-col gap-1.5 rounded-control border border-border p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {item.isToday && <Badge variant="brand" size="sm">{t("dashboard.upcoming.today")}</Badge>}
                  {item.isOverdue && <Badge variant="warning" size="sm">{t("dashboard.upcoming.overdue")}</Badge>}
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted">
                    {item.kind === "reminder" && <Bell aria-hidden="true" className="size-4" />}
                    {item.kind === "reminder" ? t("dashboard.upcoming.reminder") : t("dashboard.upcoming.due")}
                    {": "}
                    <time dateTime={item.at}>{when}</time>
                    <span className="text-ink-subtle">· {formatRelativeDay(item.at, lang, now)}</span>
                  </span>
                </div>
                <p className="text-base font-medium text-ink">{label}</p>
                <OriginBadge
                  origin={item.action.origin}
                  label={t(originKey(item.action.origin))}
                  size="sm"
                  className="self-start"
                />
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
  );
}
