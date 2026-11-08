"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { BookOpenIcon } from "@heroicons/react/20/solid";
import type { TeachBackQuestion, TeachBackSession } from "@/lib/types";
import { getGroundTruth } from "@/data/ground-truth";
import {
  Card,
  EmptyState,
  LoadingRegion,
  PageHeader,
  Skeleton,
  buttonVariants,
  useToast,
} from "@/components/ui";
import { useT } from "@/lib/i18n";
import { useActiveSession, useDemoStore, useHasHydrated } from "@/lib/store";
import { TeachBackQuestionStep } from "./TeachBackQuestionStep";
import { TeachBackSummaryCard } from "./TeachBackSummaryCard";
import { initialQuestionIndex, questionsForDocument } from "./teach-back-logic";

export interface CheckUnderstandingViewProps {
  /** Deep link (?questionId=) to start on a specific question. */
  initialQuestionId?: string;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

function emptySession(q: TeachBackQuestion): TeachBackSession {
  return {
    questionId: q.id,
    patientId: q.patientId,
    attempts: [],
    clarificationProvided: false,
    savedForClinician: false,
    completed: false,
  };
}

/** Check My Understanding (SPEC §3F + §12.6). */
export function CheckUnderstandingView({ initialQuestionId, fetchImpl }: CheckUnderstandingViewProps) {
  const t = useT();
  const { toast } = useToast();
  const hydrated = useHasHydrated();
  const session = useActiveSession();
  const upsertTeachBack = useDemoStore((s) => s.upsertTeachBack);
  const addSavedQuestion = useDemoStore((s) => s.addSavedQuestion);

  const patientId = session?.profile.id ?? "";
  const activeDocId = session?.activeDocumentId;
  const questions = useMemo(
    () => questionsForDocument(getGroundTruth(patientId), patientId, activeDocId),
    [patientId, activeDocId],
  );
  const document = session?.documents.find((d) => d.id === activeDocId);

  // Position is keyed by patient + document so switching resets it.
  const scope = `${patientId}::${activeDocId ?? ""}`;
  const [position, setPosition] = useState<{ scope: string; index: number }>(() => ({
    scope,
    index: initialQuestionIndex(questions, initialQuestionId),
  }));
  const index =
    position.scope === scope ? position.index : initialQuestionIndex(questions, initialQuestionId);
  const goTo = (i: number) => setPosition({ scope, index: i });

  const header = (
    <PageHeader
      title={t("check.title")}
      description={t("check.subtitle")}
      icon={<ClipboardDocumentCheckIcon aria-hidden="true" className="size-6" />}
    />
  );

  if (!hydrated || !session) {
    return (
      <>
        {header}
        <LoadingRegion label={t("check.loading")}>
          <Card padding="lg" className="flex flex-col gap-4">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </Card>
        </LoadingRegion>
      </>
    );
  }

  if (questions.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={<ClipboardDocumentCheckIcon aria-hidden="true" className="size-7" />}
          title={t("check.emptyTitle")}
          description={t("check.empty")}
          action={
            <Link href="/understand" className={buttonVariants({ variant: "primary" })}>
              <BookOpenIcon aria-hidden="true" className="size-5" />
              {t("check.goToUnderstand")}
            </Link>
          }
        />
      </>
    );
  }

  const total = questions.length;
  const done = index >= total;
  const current = done ? undefined : questions[index];
  const sessions = session.teachBack;

  const saveQuestion = (q: TeachBackQuestion, s: TeachBackSession | undefined) => {
    addSavedQuestion(patientId, q.prompt);
    upsertTeachBack(patientId, { ...(s ?? emptySession(q)), savedForClinician: true });
    toast({ title: t("check.savedForClinician"), variant: "success" });
  };

  return (
    <>
      {header}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <p className="text-lg font-medium text-gray-90">{t("check.intro")}</p>
          <p className="text-base text-gray-70">{t("check.introDetail")}</p>
          {document && <p className="text-sm text-gray-70">{t("check.aboutDocument", { title: document.title })}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-base font-semibold text-gray-90" data-testid="check-progress">
            {done
              ? t("check.complete.title")
              : t("check.progress", { current: index + 1, total })}
          </p>
          <div
            role="progressbar"
            aria-label={t("check.progressLabel")}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={Math.min(index, total)}
            className="h-2 w-full overflow-hidden rounded-full bg-gray-10"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width]"
              style={{ width: `${(Math.min(index, total) / total) * 100}%` }}
            />
          </div>
        </div>

        {current ? (
          <TeachBackQuestionStep
            key={`${scope}::${current.id}`}
            question={current}
            profile={session.profile}
            document={document}
            session={sessions[current.id]}
            savedQuestions={session.savedQuestions}
            isLast={index === total - 1}
            onSessionChange={(s) => upsertTeachBack(patientId, s)}
            onSaveQuestion={saveQuestion}
            onNext={() => goTo(index + 1)}
            fetchImpl={fetchImpl}
          />
        ) : (
          <TeachBackSummaryCard questions={questions} sessions={sessions} onReview={() => goTo(0)} />
        )}
      </div>
    </>
  );
}
