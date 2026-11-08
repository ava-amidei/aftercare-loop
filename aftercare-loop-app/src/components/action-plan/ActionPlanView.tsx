"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { DocumentCheckIcon, FlagIcon, ListBulletIcon, QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { ArrowPathIcon, BookOpenIcon, XMarkIcon } from "@heroicons/react/20/solid";
import type { ActionCategory, ActionItem, ActionStatus, Reminder, VisitDocument } from "@/lib/types";
import {
  Alert,
  Card,
  EmptyState,
  LoadingRegion,
  ModeBadge,
  PageHeader,
  Skeleton,
  Button,
  buttonVariants,
  useToast,
} from "@/components/ui";
import { actionCategoryHintKey, actionCategoryKey, useT } from "@/lib/i18n";
import { toClinicQuestion } from "@/lib/services/barriers";
import { actionProgress, useActiveSession, useDemoStore, useHasHydrated } from "@/lib/store";
import { AddItemForm } from "./AddItemForm";
import { ActionItemCard } from "./ActionItemCard";
import { BarrierSuggestions } from "./BarrierSuggestions";
import { NeedsClarification } from "./NeedsClarification";
import {
  buildActionPlanRequest,
  createPatientAction,
  groupActionPlan,
  parseActionPlanResponse,
  sectionCounts,
} from "./plan-logic";
import { useDueReminderToast } from "./useDueReminderToast";
import { useSourceViewer } from "@/components/understand/SourceViewer";

const SECTION_ICONS: Record<ActionCategory, typeof DocumentCheckIcon> = {
  care_plan: DocumentCheckIcon,
  wellness_goal: FlagIcon,
  provider_question: QuestionMarkCircleIcon,
};

function Section({
  category,
  count,
  children,
}: {
  category: ActionCategory;
  count: number;
  children: ReactNode;
}) {
  const t = useT();
  const Icon = SECTION_ICONS[category];
  const headingId = `section-${category}`;
  return (
    <section aria-labelledby={headingId} data-testid={`section-${category}`} className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-900">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id={headingId} className="flex flex-wrap items-center gap-2 text-xl font-semibold text-gray-90">
            {t(actionCategoryKey(category))}
            <span
              data-testid={`count-${category}`}
              className="inline-flex min-w-8 items-center justify-center rounded-full bg-primary px-2 py-0.5 text-sm font-bold text-primary-contrast"
            >
              <span aria-hidden="true">{count}</span>
              <span className="sr-only">{t("actionPlan.count", { count })}</span>
            </span>
          </h2>
          <p className="text-base text-gray-70">{t(actionCategoryHintKey(category))}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function CategoryEmpty() {
  const t = useT();
  return (
    <p className="rounded-3xl bg-gray-0 px-4 py-5 text-center text-base text-gray-70">
      {t("actionPlan.categoryEmpty")}
    </p>
  );
}

function PlanSkeleton() {
  const t = useT();
  return (
    <LoadingRegion label={t("actionPlan.loading")} className="flex flex-col gap-4">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="flex flex-col gap-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      ))}
    </LoadingRegion>
  );
}

export interface ActionPlanViewProps {
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

/** My Action Plan (SPEC §3E + §12.4 + §12.7). Client-side state via useDemoStore. */
export function ActionPlanView({ fetchImpl }: ActionPlanViewProps = {}) {
  const t = useT();
  const { toast } = useToast();
  const hydrated = useHasHydrated();
  const session = useActiveSession();
  const upsertActions = useDemoStore((s) => s.upsertActions);
  const setActionStatus = useDemoStore((s) => s.setActionStatus);
  const addReminder = useDemoStore((s) => s.addReminder);
  const addSavedQuestion = useDemoStore((s) => s.addSavedQuestion);
  const removeSavedQuestion = useDemoStore((s) => s.removeSavedQuestion);
  const viewer = useSourceViewer();
  const [rebuilding, setRebuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patientId = session?.profile.id ?? "";
  const actions = useMemo(() => session?.actions ?? [], [session]);
  const grouped = useMemo(() => groupActionPlan(actions), [actions]);
  const counts = sectionCounts(grouped);
  // Fix 13: AI suggestions are optional ideas, not steps — they never inflate the progress count.
  const progress = useMemo(
    () => actionProgress(actions.filter((a) => a.origin === "clinician_documented" || a.origin === "patient_selected")),
    [actions],
  );
  const docsById = useMemo(
    () => new Map<string, VisitDocument>((session?.documents ?? []).map((d) => [d.id, d])),
    [session],
  );
  const activeDoc = session?.activeDocumentId ? docsById.get(session.activeDocumentId) : undefined;
  const interpretation = activeDoc ? session?.interpretations[activeDoc.id] : undefined;
  const savedQuestions = session?.savedQuestions ?? [];

  useDueReminderToast(patientId, actions, hydrated && !!session);

  const rebuild = useCallback(async () => {
    if (!session) return;
    const body = buildActionPlanRequest(session);
    if (!body) {
      setError(t("actionPlan.noDocument"));
      return;
    }
    setRebuilding(true);
    setError(null);
    try {
      const res = await (fetchImpl ?? fetch)("/api/action-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const items = parseActionPlanResponse(await res.json());
      upsertActions(body.patientId, items);
      toast({ title: t("actionPlan.rebuildDone"), variant: "success" });
    } catch {
      setError(t("actionPlan.rebuildError"));
    } finally {
      setRebuilding(false);
    }
  }, [session, fetchImpl, upsertActions, toast, t]);

  const onStatus = (item: ActionItem, status: ActionStatus) => setActionStatus(item.patientId, item.id, status);
  const onReminder = (item: ActionItem, reminder: Reminder) => {
    addReminder(item.patientId, item.id, reminder);
    if (!reminder.dismissed) toast({ title: t("actionPlan.reminder.saved"), variant: "success" });
  };

  const addOwn = (category: "wellness_goal" | "provider_question", text: string) => {
    const item = createPatientAction({
      patientId,
      description: text,
      category,
      rationale: t("common.origin.patient_selected"),
    });
    if (!item) return;
    upsertActions(patientId, [item]);
    toast({
      title: category === "wellness_goal" ? t("actionPlan.goalAdded") : t("actionPlan.questionAdded"),
      variant: "success",
    });
  };

  const renderCards = (items: ActionItem[]) =>
    items.length === 0 ? (
      <CategoryEmpty />
    ) : (
      <ul className="flex flex-col gap-3">
        {items.map((a) => (
          <li key={a.id}>
            <ActionItemCard
              action={a}
              onViewSource={() =>
                viewer.show(a.documentId ? docsById.get(a.documentId) : undefined, a.sourceRef, a.description)
              }
              onStatusChange={(s) => onStatus(a, s)}
              onReminderChange={(r) => onReminder(a, r)}
            />
          </li>
        ))}
      </ul>
    );

  const header = (
    <PageHeader
      title={t("actionPlan.title")}
      description={t("actionPlan.subtitle")}
      icon={<ListBulletIcon aria-hidden="true" className="size-6" />}
      actions={
        hydrated && actions.length > 0 && activeDoc ? (
          <Button
            variant="secondary"
            onClick={rebuild}
            loading={rebuilding}
            loadingLabel={t("actionPlan.generating")}
            leftIcon={<ArrowPathIcon aria-hidden="true" className="size-5" />}
            title={t("actionPlan.rebuildHint")}
          >
            {t("actionPlan.rebuild")}
          </Button>
        ) : undefined
      }
    />
  );

  if (!hydrated || !session) {
    return (
      <>
        {header}
        <PlanSkeleton />
      </>
    );
  }

  const errorAlert = error && (
    <Alert
      variant="danger"
      title={error}
      action={
        activeDoc ? (
          <Button size="sm" variant="secondary" onClick={rebuild} loading={rebuilding}>
            {t("common.retry")}
          </Button>
        ) : undefined
      }
    >
      {t("common.errorDetail")}
    </Alert>
  );

  if (actions.length === 0) {
    return (
      <>
        {header}
        <div className="flex flex-col gap-4">
          {errorAlert}
          <EmptyState
            icon={<ListBulletIcon aria-hidden="true" className="size-7" />}
            title={t("actionPlan.emptyTitle")}
            description={t("actionPlan.empty")}
            action={
              // With a document, "Build my action plan" is the primary CTA and
              // comes first so it sits higher on mobile, clear of the Ask Kat FAB.
              <>
                {activeDoc && (
                  <Button
                    variant="primary"
                    onClick={rebuild}
                    loading={rebuilding}
                    loadingLabel={t("actionPlan.generating")}
                  >
                    {t("actionPlan.generate")}
                  </Button>
                )}
                <Link href="/understand" className={buttonVariants({ variant: activeDoc ? "secondary" : "primary" })}>
                  <BookOpenIcon aria-hidden="true" className="size-5" />
                  {t("actionPlan.goToUnderstand")}
                </Link>
              </>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="flex flex-col gap-8">
        {errorAlert}
        <div className="flex flex-col gap-2">
          <p className="text-base font-medium text-gray-90" data-testid="plan-progress">
            {t("actionPlan.progress", { completed: progress.completed, total: progress.total })}
          </p>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-gray-10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.completed}
            aria-label={t("actionPlan.progress", { completed: progress.completed, total: progress.total })}
          >
            <div
              className="h-full rounded-full bg-success transition-[width]"
              style={{ width: progress.total ? `${(progress.completed / progress.total) * 100}%` : "0%" }}
            />
          </div>
          <p className="text-sm text-gray-70">{t("actionPlan.reminder.inAppOnly")}</p>
        </div>

        <Section category="care_plan" count={counts.care_plan}>
          {renderCards(grouped.carePlan)}
        </Section>

        <Section category="wellness_goal" count={counts.wellness_goal}>
          {renderCards(grouped.wellness)}
          <AddItemForm
            label={t("actionPlan.addGoal")}
            hint={t("actionPlan.addGoalHint")}
            placeholder={t("actionPlan.goalPlaceholder")}
            submitLabel={t("common.add")}
            requiredMessage={t("actionPlan.inputRequired")}
            onAdd={(text) => addOwn("wellness_goal", text)}
          />
        </Section>

        <Section category="provider_question" count={counts.provider_question}>
          {interpretation?.meta && grouped.questions.some((q) => q.origin === "ai_suggested") && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-70">
              <span>{t("actionPlan.modeNote")}</span>
              <ModeBadge mode={interpretation.meta.mode} model={interpretation.meta.model} compact />
            </div>
          )}
          {renderCards(grouped.questions)}
          <NeedsClarification items={grouped.needsClarification} onStatusChange={onStatus} />
          {savedQuestions.length > 0 && (
            <Card tone="muted" className="flex flex-col gap-2" data-testid="saved-questions">
              <h3 className="text-lg font-semibold text-gray-90">{t("actionPlan.saved.title")}</h3>
              <p className="text-sm text-gray-70">{t("actionPlan.saved.hint")}</p>
              <ul className="flex flex-col gap-1">
                {savedQuestions.map((q) => (
                  <li key={q} className="flex items-start gap-2">
                    <QuestionMarkCircleIcon aria-hidden="true" className="mt-3 size-4 shrink-0 text-gray-70" />
                    <span className="flex-1 py-2.5 text-base break-words text-gray-90">{q}</span>
                    <button
                      type="button"
                      onClick={() => removeSavedQuestion(patientId, q)}
                      aria-label={t("actionPlan.saved.remove", { question: q })}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-gray-70 hover:bg-gray-0"
                    >
                      <XMarkIcon aria-hidden="true" className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <AddItemForm
            label={t("actionPlan.addQuestion")}
            hint={t("actionPlan.addQuestionHint")}
            placeholder={t("actionPlan.questionPlaceholder")}
            submitLabel={t("common.add")}
            requiredMessage={t("actionPlan.inputRequired")}
            onAdd={(text) => addOwn("provider_question", text)}
          />
        </Section>

        <BarrierSuggestions
          items={grouped.barrierSuggestions}
          savedQuestions={savedQuestions}
          onAddToQuestions={(item) => {
            // Save the clinic-facing wording, not the "Would you like to ask…" prompt.
            addSavedQuestion(patientId, toClinicQuestion(item.description));
            toast({ title: t("actionPlan.barrier.added"), variant: "success" });
          }}
        />
      </div>
      {viewer.element}
    </>
  );
}
