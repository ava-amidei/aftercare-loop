"use client";

import Link from "next/link";
import { FlagIcon } from "@heroicons/react/24/outline";
import { useT } from "@/lib/i18n";
import type { GoalProgress } from "./dashboard-data";
import { InlineEmpty, SectionCard } from "./SectionCard";

/** Personal learning goals (profile) + wellness-goal completion (action plan). */
export function GoalsCard({ healthGoals, progress }: { healthGoals: string[]; progress: GoalProgress }) {
  const t = useT();
  const goals = healthGoals.filter((g) => g.trim().length > 0);
  return (
    <SectionCard id="dashboard-goals" title={t("dashboard.goals.title")} icon={<FlagIcon aria-hidden="true" className="size-5" />}>
      {progress.percent === null ? (
        <p className="text-sm text-gray-70">{t("dashboard.goals.noWellness")}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="text-base font-medium text-gray-90">
            {t("dashboard.goals.progress", { completed: progress.completed, total: progress.total })}
          </p>
          <div
            role="progressbar"
            aria-label={t("dashboard.goals.progressLabel")}
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.completed}
            aria-valuetext={t("dashboard.goals.progress", { completed: progress.completed, total: progress.total })}
            className="h-3 w-full overflow-hidden rounded-full bg-gray-5"
          >
            <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${progress.percent}%` }} />
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-70">{t("dashboard.goals.learning")}</h3>
        {goals.length === 0 ? (
          <InlineEmpty
            action={
              <Link
                href="/profile"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-800 underline underline-offset-4"
              >
                {t("dashboard.topics.edit")}
              </Link>
            }
          >
            {t("dashboard.goals.empty")}
          </InlineEmpty>
        ) : (
          <ul className="flex list-disc flex-col gap-1 pl-5 text-base text-gray-90">
            {goals.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        )}
      </div>
    </SectionCard>
  );
}
