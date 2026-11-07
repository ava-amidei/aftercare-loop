"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, MessageCircleHeart } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingRegion, Skeleton } from "@/components/ui/Skeleton";
import { useT } from "@/lib/i18n";
import { useDemoStore } from "@/lib/store/demo-store";
import { useHasHydrated } from "@/lib/store/hydration";
import { selectActiveSession } from "@/lib/store/selectors";
import { CareTeamTasks } from "./CareTeamTasks";
import { DashboardErrorBoundary } from "./DashboardErrorBoundary";
import {
  careTeamTasks,
  hasInterpretedDocument,
  recentQuestions,
  upcomingItems,
  wellnessGoalProgress,
} from "./dashboard-data";
import { GoalsCard } from "./GoalsCard";
import { HealthTopics } from "./HealthTopics";
import { PrimaryActions } from "./PrimaryActions";
import { RecentQuestions } from "./RecentQuestions";
import { UpcomingList } from "./UpcomingList";
import { VisitSummaryCard } from "./VisitSummaryCard";

export interface DashboardProps {
  /** Injectable clock for tests; defaults to the time of first render. */
  now?: Date;
}

function DashboardSkeleton({ label }: { label: string }) {
  return (
    <LoadingRegion label={label} className="flex flex-col gap-6">
      <Skeleton className="h-9 w-2/3 max-w-sm" />
      <Skeleton className="h-5 w-full max-w-md" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 rounded-card" />
        ))}
      </div>
    </LoadingRegion>
  );
}

/** Home / My Health Dashboard (SPEC §3A). Client-only state via useDemoStore. */
export function Dashboard({ now: nowProp }: DashboardProps) {
  const t = useT();
  const hydrated = useHasHydrated();
  const session = useDemoStore(selectActiveSession);
  const setKatOpen = useDemoStore((s) => s.setKatOpen);
  const resetDemo = useDemoStore((s) => s.resetDemo);
  const [initialNow] = useState(() => new Date());
  const now = nowProp ?? initialNow;

  const view = useMemo(() => {
    if (!session) return null;
    const activeDoc =
      session.documents.find((d) => d.id === session.activeDocumentId) ?? session.documents.at(-1);
    return {
      activeDoc,
      interpretation: activeDoc ? session.interpretations[activeDoc.id] : undefined,
      interpreted: hasInterpretedDocument(session),
      tasks: careTeamTasks(session.actions),
      upcoming: upcomingItems(session.actions, now),
      goals: wellnessGoalProgress(session.actions),
      recent: recentQuestions(session.chat, session.savedQuestions),
    };
  }, [session, now]);

  if (!hydrated) return <DashboardSkeleton label={t("dashboard.loading")} />;

  if (!session || !view || !session.profile.id) {
    return (
      <EmptyState
        headingLevel="h1"
        title={t("dashboard.error.title")}
        description={t("dashboard.error.noPatient")}
        action={
          <Button variant="secondary" onClick={() => resetDemo()}>
            {t("common.resetDemo")}
          </Button>
        }
      />
    );
  }

  const { profile } = session;
  const openKat = () => setKatOpen(true);
  const name = profile.displayName.trim();

  const regionFallback = (retry: () => void) => (
    <Alert variant="danger" title={t("common.error")} action={<Button variant="secondary" size="sm" onClick={retry}>{t("common.retry")}</Button>}>
      {t("common.errorDetail")}
    </Alert>
  );

  return (
    <div className="flex flex-col gap-6" data-testid="dashboard" data-patient-id={profile.id}>
      <PageHeader
        eyebrow={t("dashboard.title")}
        title={name ? t("dashboard.greeting", { name }) : t("dashboard.greetingNoName")}
        description={t("dashboard.subtitle")}
        actions={
          <Button
            variant="accent"
            size="lg"
            onClick={openKat}
            aria-haspopup="dialog"
            leftIcon={<MessageCircleHeart aria-hidden="true" className="size-6" />}
            className="w-full sm:w-auto"
          >
            {t("dashboard.askKat.cta")}
          </Button>
        }
      />

      {profile.scenarioSummary && (
        <p className="-mt-3 flex flex-wrap items-center gap-2 text-base text-ink-muted">
          <Badge variant="neutral" size="sm">{t("dashboard.scenario")}</Badge>
          <span data-testid="scenario-summary">{profile.scenarioSummary}</span>
        </p>
      )}

      {!view.interpreted && (
        <Card tone="brand" className="flex flex-col gap-3 sm:flex-row sm:items-center" data-testid="dashboard-start-nudge">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-brand-700">
            <BookOpen aria-hidden="true" className="size-6" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 className="text-lg font-semibold text-ink">{t("dashboard.start.title")}</h2>
            <p className="text-base text-ink-muted">{t("dashboard.start.body")}</p>
          </div>
          <Link href="/understand" className={buttonVariants({ variant: "primary", className: "w-full sm:w-auto" })}>
            {t("dashboard.start.cta")}
          </Link>
        </Card>
      )}

      <DashboardErrorBoundary fallback={regionFallback}>
        <PrimaryActions onAskKat={openKat} />
      </DashboardErrorBoundary>

      <DashboardErrorBoundary fallback={regionFallback}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CareTeamTasks tasks={view.tasks} documents={session.documents} interpreted={view.interpreted} />
          <UpcomingList items={view.upcoming} now={now} />
          <HealthTopics conditions={profile.conditions} />
          <GoalsCard healthGoals={profile.healthGoals} progress={view.goals} />
          <RecentQuestions data={view.recent} onAskKat={openKat} />
          <VisitSummaryCard document={view.activeDoc} interpretation={view.interpretation} />
        </div>
      </DashboardErrorBoundary>
    </div>
  );
}
