"use client";

import Link from "next/link";
import { HeartIcon } from "@heroicons/react/24/outline";
import { useT } from "@/lib/i18n";
import { InlineEmpty, SectionCard } from "./SectionCard";

/** "Your health topics": the profile's conditions/concerns as chips. */
export function HealthTopics({ conditions }: { conditions: string[] }) {
  const t = useT();
  const topics = conditions.filter((c) => c.trim().length > 0);
  const editLink = (
    <Link
      href="/profile"
      className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-800 underline underline-offset-4"
    >
      {t("dashboard.topics.edit")}
    </Link>
  );
  return (
    <SectionCard
      id="dashboard-topics"
      title={t("dashboard.topics.title")}
      icon={<HeartIcon aria-hidden="true" className="size-5" />}
    >
      {topics.length === 0 ? (
        <InlineEmpty action={editLink}>{t("dashboard.topics.empty")}</InlineEmpty>
      ) : (
        <>
          <ul className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <li
                key={topic}
                className="rounded-full bg-secondary-100 px-3 py-1.5 text-sm font-semibold text-gray-90"
              >
                {topic}
              </li>
            ))}
          </ul>
          <div>{editLink}</div>
        </>
      )}
    </SectionCard>
  );
}
