"use client";

import { Bookmark, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n";
import type { RecentQuestions as RecentQuestionsData } from "./dashboard-data";
import { InlineEmpty, SectionCard } from "./SectionCard";

/** Last user messages to Kat (this patient only) + questions saved for the appointment. */
export function RecentQuestions({ data, onAskKat }: { data: RecentQuestionsData; onAskKat: () => void }) {
  const t = useT();
  const empty = data.recentChat.length === 0 && data.saved.length === 0;
  return (
    <SectionCard
      id="dashboard-recent"
      title={t("dashboard.recent.title")}
      icon={<MessageSquareText aria-hidden="true" className="size-5" />}
    >
      {empty ? (
        <InlineEmpty
          action={
            <Button variant="secondary" size="sm" onClick={onAskKat} aria-haspopup="dialog">
              {t("dashboard.askKat.cta")}
            </Button>
          }
        >
          {t("dashboard.recent.empty")}
        </InlineEmpty>
      ) : (
        <>
          {data.recentChat.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-ink-muted">{t("dashboard.recent.asked")}</h3>
              <ul className="flex flex-col gap-1.5" data-testid="recent-chat">
                {data.recentChat.map((m) => (
                  <li key={m.id} className="rounded-control bg-surface-muted px-3 py-2 text-base text-ink">
                    {m.content}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.saved.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-ink-muted">{t("dashboard.recent.saved")}</h3>
              <ul className="flex flex-col gap-1.5" data-testid="saved-questions">
                {data.saved.map((q) => (
                  <li key={q} className="flex items-start gap-2 text-base text-ink">
                    <Bookmark aria-hidden="true" className="mt-1 size-4 shrink-0 text-brand-700" />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
