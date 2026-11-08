"use client";
/**
 * Simulated clinician view (SPEC §3G). Fictional simulation only: nothing is
 * transmitted, no AI actions run here, and nothing on this page authorizes
 * refills or changes prescriptions.
 */
import { useState } from "react";
import { InboxIcon, ShieldExclamationIcon, UsersIcon } from "@heroicons/react/24/outline";
import type { CareTeamRequest, PatientSessionState } from "@/lib/types";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  LoadingRegion,
  OriginBadge,
  PageHeader,
  SkeletonText,
  useToast,
} from "@/components/ui";
import { actionStatusKey, barrierKey, careTeamStatusKey, careTeamTypeKey, originKey, useT } from "@/lib/i18n";
import { advanceRequest, nextStatus, seedRequests } from "@/lib/services/care-team";
import { isUnverifiedClinicianItem, useActiveSession, useDemoStore, useHasHydrated } from "@/lib/store";
import { formatDate } from "@/lib/utils/dates";
import {
  CARE_TEAM_TYPES,
  filterByType,
  groupByStatus,
  incompleteFollowUps,
  isSeedRequest,
  mergeQueue,
  replaceRequest,
  type TypeFilter,
} from "./care-team-helpers";
import { RequestCard } from "./RequestCard";

function SimulationBanner() {
  const t = useT();
  return (
    <Alert
      variant="warning"
      icon={<ShieldExclamationIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />}
      title={t("careTeam.banner")}
      data-testid="care-team-banner"
      className="mb-6"
    >
      {t("careTeam.fictionalNotice")}
    </Alert>
  );
}

export function CareTeamView() {
  const t = useT();
  const hydrated = useHasHydrated();
  const session = useActiveSession();

  const header = (
    <PageHeader
      eyebrow={t("careTeam.staffView")}
      title={t("careTeam.title")}
      description={session ? t("careTeam.description", { name: session.profile.displayName }) : undefined}
      icon={<UsersIcon aria-hidden="true" className="size-6" />}
    />
  );

  let body;
  if (!hydrated) {
    body = (
      <LoadingRegion label={t("careTeam.loading")}>
        <Card>
          <SkeletonText lines={6} />
        </Card>
      </LoadingRegion>
    );
  } else if (!session) {
    body = (
      <Alert variant="danger" title={t("careTeam.error")}>
        {t("common.errorDetail")}
      </Alert>
    );
  } else {
    body = <CareTeamContent key={session.profile.id} session={session} />;
  }

  return (
    <>
      <SimulationBanner />
      {header}
      {body}
    </>
  );
}

type SeedState = { seeds: CareTeamRequest[]; error: boolean };

function makeSeeds(patientId: string): SeedState {
  try {
    return { seeds: seedRequests(patientId), error: false };
  } catch {
    return { seeds: [], error: true };
  }
}

function CareTeamContent({ session }: { session: PatientSessionState }) {
  const t = useT();
  const { toast } = useToast();
  const advanceCareTeamRequest = useDemoStore((s) => s.advanceCareTeamRequest);
  const { profile, actions } = session;
  // Seeded fictional examples live only in page state; they are not the patient's own requests.
  const [seedState, setSeedState] = useState<SeedState>(() => makeSeeds(profile.id));
  const [filter, setFilter] = useState<TypeFilter>("all");

  if (seedState.error) {
    return (
      <Alert
        variant="danger"
        title={t("careTeam.error")}
        action={
          <Button variant="secondary" onClick={() => setSeedState(makeSeeds(profile.id))}>
            {t("common.retry")}
          </Button>
        }
      >
        {t("common.errorDetail")}
      </Alert>
    );
  }

  const queue = mergeQueue(session.careTeamRequests, seedState.seeds);
  const visible = filterByType(queue, filter);
  const groups = groupByStatus(visible);
  const followUps = incompleteFollowUps(actions);
  const actionById = new Map(actions.map((a) => [a.id, a]));

  const onAdvance = (req: CareTeamRequest) => {
    if (req.status === "closed") return;
    const to = nextStatus(req.status);
    if (isSeedRequest(req)) {
      setSeedState((s) => ({ ...s, seeds: replaceRequest(s.seeds, advanceRequest(req)) }));
    } else {
      advanceCareTeamRequest(profile.id, req.id);
    }
    toast({ title: t("careTeam.advanced", { status: t(careTeamStatusKey(to)) }), variant: "info" });
  };

  const filters: TypeFilter[] = ["all", ...CARE_TEAM_TYPES];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
      <section aria-labelledby="ct-queue" className="flex flex-col gap-4">
        <h2 id="ct-queue" className="text-xl font-semibold text-gray-90">
          {t("careTeam.queue.title")}
        </h2>
        <div role="group" aria-label={t("careTeam.filter.label")} className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "primary" : "secondary"}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? t("careTeam.filter.all") : t(careTeamTypeKey(f))}
            </Button>
          ))}
        </div>

        {visible.length === 0 ? (
          <Card>
            <EmptyState
              icon={<InboxIcon aria-hidden="true" className="size-7" />}
              title={queue.length === 0 ? t("careTeam.empty") : t("careTeam.emptyFiltered")}
              description={t("careTeam.emptyDescription")}
              headingLevel="h3"
            />
          </Card>
        ) : (
          groups.map(({ status, requests }) => (
            <section key={status} aria-labelledby={`ct-status-${status}`} className="flex flex-col gap-3">
              <h3 id={`ct-status-${status}`} className="flex items-center gap-2 text-lg font-semibold text-gray-90">
                {t(careTeamStatusKey(status))}
                <Badge variant="neutral" size="sm">
                  {requests.length}
                </Badge>
              </h3>
              {requests.length === 0 ? (
                <p className="text-sm text-gray-70">{t("careTeam.group.empty")}</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {requests.map((r) => (
                    <li key={r.id}>
                      <RequestCard
                        request={r}
                        patientName={profile.displayName}
                        language={profile.language}
                        relatedAction={r.relatedActionId ? actionById.get(r.relatedActionId) : undefined}
                        onAdvance={onAdvance}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))
        )}
      </section>

      <aside className="flex flex-col gap-6">
        <Alert variant="info">
          <p>{t("careTeam.noAuthorization")}</p>
          <p className="mt-1">{t("careTeam.staffNote")}</p>
          <p className="mt-1">{t("careTeam.noAi")}</p>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle as="h2">{t("careTeam.followUps.title")}</CardTitle>
            <CardDescription>
              {t("careTeam.readOnly")} · {t("careTeam.followUps.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {followUps.length === 0 ? (
              <p className="text-base text-gray-70">{t("careTeam.followUps.empty")}</p>
            ) : (
              <ul className="flex flex-col gap-3" data-testid="care-team-followups">
                {followUps.map((a) => (
                  <li key={a.id} className="flex flex-col gap-1.5 rounded-2xl bg-gray-5 p-3">
                    <span className="text-base text-gray-90">{a.description}</span>
                    <span className="flex flex-wrap items-center gap-2">
                      <OriginBadge origin={a.origin} label={t(originKey(a.origin))} size="sm" />
                      <Badge variant={a.status === "needs_clarification" ? "warning" : "neutral"} size="sm">
                        {t(actionStatusKey(a.status))}
                      </Badge>
                      {a.dueDate && (
                        <span className="text-sm text-gray-70">
                          {t("common.dueDate", { date: formatDate(a.dueDate, profile.language) })}
                        </span>
                      )}
                    </span>
                    {isUnverifiedClinicianItem(a) && (
                      <span className="text-sm font-medium text-warning-strong">
                        {t("careTeam.followUps.unverified")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2">{t("careTeam.barriers.title")}</CardTitle>
            <CardDescription>
              {t("careTeam.readOnly")} · {t("careTeam.barriers.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile.barriers.length === 0 ? (
              <p className="text-base text-gray-70">{t("careTeam.barriers.empty")}</p>
            ) : (
              <ul className="flex flex-col gap-2" data-testid="care-team-barriers">
                {profile.barriers.map((b) => (
                  <li key={b} className="flex flex-wrap items-center gap-2 rounded-2xl bg-gray-5 p-2">
                    <span className="text-base text-gray-90">{t(barrierKey(b))}</span>
                    <OriginBadge origin="patient_selected" label={t("careTeam.barriers.reported")} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
