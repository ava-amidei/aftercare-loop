"use client";

import Link from "next/link";
import { ArrowUturnLeftIcon, ListBulletIcon } from "@heroicons/react/20/solid";
import type { QuestionId, TeachBackQuestion, TeachBackSession } from "@/lib/types";
import { Badge, Button, Card, buttonVariants } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { summarizeSessions } from "./teach-back-logic";

export interface TeachBackSummaryCardProps {
  questions: TeachBackQuestion[];
  sessions: Record<QuestionId, TeachBackSession | undefined>;
  onReview: () => void;
}

/** End-of-check summary: initial vs final correctness, never "failed" language. */
export function TeachBackSummaryCard({ questions, sessions, onReview }: TeachBackSummaryCardProps) {
  const t = useT();
  const s = summarizeSessions(questions, sessions);

  const status = (value: boolean | undefined, answered: boolean) =>
    !answered ? (
      <Badge size="sm">{t("check.summary.notAnswered")}</Badge>
    ) : value ? (
      <Badge size="sm" variant="success">
        {t("check.summary.clear")}
      </Badge>
    ) : (
      <Badge size="sm" variant="info">
        {t("check.summary.stillUnclear")}
      </Badge>
    );

  return (
    <Card padding="lg" className="flex flex-col gap-5" data-testid="teach-back-summary">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-semibold text-gray-90">{t("check.summary.title")}</h2>
        <p className="text-base text-gray-70">{t("check.summary.intro")}</p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        <li className="rounded-2xl bg-primary-50 px-4 py-3 text-base font-medium text-primary-900">
          {t("check.summary.firstTry", { count: s.initialCorrect, total: s.total })}
        </li>
        <li className="rounded-2xl bg-primary-50 px-4 py-3 text-base font-medium text-primary-900">
          {t("check.summary.byEnd", { count: s.finalCorrect, total: s.total })}
        </li>
        <li className="rounded-2xl bg-gray-5 px-4 py-3 text-base text-gray-90">
          {t("check.summary.clarified", { count: s.clarified })}
        </li>
        <li className="rounded-2xl bg-gray-5 px-4 py-3 text-base text-gray-90">
          {t("check.summary.savedCount", { count: s.savedForClinician })}
        </li>
      </ul>
      <ol className="flex flex-col gap-3">
        {questions.map((q, i) => {
          const session = sessions[q.id];
          const answered = !!session && session.attempts.length > 0;
          return (
            <li key={q.id} className="flex flex-col gap-2 rounded-2xl bg-gray-5 p-3">
              <p className="font-medium text-gray-90">
                {i + 1}. {q.prompt}
              </p>
              <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <dt className="text-gray-70">{t("check.summary.questionFirst")}:</dt>
                  <dd>{status(session?.initialCorrect, answered)}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className="text-gray-70">{t("check.summary.questionFinal")}:</dt>
                  <dd>{status(session?.finalCorrect, answered)}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ol>
      <p className="text-base text-gray-90">{t("check.complete.body")}</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={onReview} leftIcon={<ArrowUturnLeftIcon aria-hidden="true" className="size-5" />}>
          {t("check.summary.reviewAgain")}
        </Button>
        <Link href="/action-plan" className={buttonVariants({ variant: "primary" })}>
          <ListBulletIcon aria-hidden="true" className="size-5" />
          {t("check.summary.viewPlan")}
        </Link>
      </div>
    </Card>
  );
}
