"use client";
/**
 * Follow Up — "Prepare for My Appointment" (SPEC §12.10).
 * Builds an editable CommunicationSummary from the active patient's demo
 * state. Copy / Update / Save locally; "send" only adds a fictional request
 * to the simulated care-team queue. Nothing is ever transmitted.
 */
import { useState } from "react";
import Link from "next/link";
import { ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";
import { ArrowPathIcon, CheckCircleIcon, DocumentDuplicateIcon, PaperAirplaneIcon } from "@heroicons/react/20/solid";
import type { CommunicationSummary, PatientSessionState, SafetyVerdict } from "@/lib/types";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LoadingRegion,
  PageHeader,
  SkeletonText,
  Textarea,
  buttonVariants,
  useToast,
} from "@/components/ui";
import { useT } from "@/lib/i18n";
import { evaluateSafety } from "@/lib/safety/rules";
import { safetyContextOf } from "@/lib/safety/context";
import { buildCommunicationSummary } from "@/lib/services/communication-summary";
import { useActiveSession, useDemoStore, useHasHydrated } from "@/lib/store";
import { CareTeamRequestForm } from "./CareTeamRequestForm";
import { SafetyNotice } from "./SafetyNotice";
import { SummarySections } from "./SummarySections";
import { buildSummaryRequest } from "./follow-up-helpers";

type BuildResult = { summary: CommunicationSummary; error: null } | { summary: null; error: unknown };

function tryBuild(session: PatientSessionState): BuildResult {
  try {
    return { summary: buildCommunicationSummary(session), error: null };
  } catch (error) {
    return { summary: null, error };
  }
}

export function FollowUpView() {
  const t = useT();
  const hydrated = useHasHydrated();
  const session = useActiveSession();

  const header = (
    <PageHeader
      title={t("followUp.pageTitle")}
      description={t("followUp.subtitle")}
      icon={<ChatBubbleBottomCenterTextIcon aria-hidden="true" className="size-6" />}
    />
  );

  if (!hydrated) {
    return (
      <>
        {header}
        <LoadingRegion label={t("followUp.loading")}>
          <Card>
            <SkeletonText lines={6} />
          </Card>
        </LoadingRegion>
      </>
    );
  }

  if (!session) {
    return (
      <>
        {header}
        <Alert variant="danger" title={t("followUp.error")}>
          {t("common.errorDetail")}
        </Alert>
      </>
    );
  }

  return (
    <>
      {header}
      <FollowUpContent key={session.profile.id} session={session} />
    </>
  );
}

function FollowUpContent({ session }: { session: PatientSessionState }) {
  const t = useT();
  const { toast } = useToast();
  const setCommunicationSummary = useDemoStore((s) => s.setCommunicationSummary);
  const addCareTeamRequest = useDemoStore((s) => s.addCareTeamRequest);
  const { profile } = session;
  const saved = session.communicationSummary;

  const [result, setResult] = useState<BuildResult>(() =>
    saved ? { summary: saved, error: null } : tryBuild(session),
  );
  const [text, setText] = useState(() => result.summary?.text ?? "");
  const [sent, setSent] = useState(false);
  const [verdict, setVerdict] = useState<SafetyVerdict | null>(null);

  const regenerate = () => {
    const next = tryBuild(session);
    setResult(next);
    if (next.summary) {
      setText(next.summary.text);
      toast({ title: t("followUp.summary.regenerated"), variant: "info" });
    }
  };

  if (result.error || !result.summary) {
    return (
      <Alert
        variant="danger"
        title={t("followUp.error")}
        action={
          <Button variant="secondary" onClick={regenerate} leftIcon={<ArrowPathIcon aria-hidden="true" className="size-5" />}>
            {t("common.retry")}
          </Button>
        }
      >
        {t("common.errorDetail")}
      </Alert>
    );
  }

  const summary = result.summary;
  const isSaved = saved !== undefined && saved.text === text;

  const save = () => {
    setCommunicationSummary(profile.id, { ...summary, text });
    toast({ title: t("followUp.summary.saved"), variant: "success" });
  };

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      toast({ title: t("followUp.summary.copied"), variant: "success" });
    } catch {
      toast({ title: t("followUp.summary.copyFailed"), variant: "warning" });
    }
  };

  const send = () => {
    const req = buildSummaryRequest({
      patientId: profile.id,
      text,
      summaryLine: t("followUp.send.requestSummary"),
    });
    if (!req) {
      toast({ title: t("followUp.send.emptyText"), variant: "warning" });
      return;
    }
    setVerdict(
      evaluateSafety(text, {
        language: profile.language,
        ...safetyContextOf(profile),
      }),
    );
    addCareTeamRequest(profile.id, req);
    setSent(true);
    toast({ title: t("followUp.send.done"), variant: "success" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <SummarySections summary={summary} session={session} />

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("followUp.summary.title")}</CardTitle>
            <CardDescription>{t("followUp.summary.assembled")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Textarea
              label={t("followUp.summary.editLabel")}
              hint={t("followUp.summary.editHint")}
              rows={14}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="text-base"
            />
            <p className="text-sm text-gray-70" aria-live="polite" data-testid="follow-up-save-state">
              {isSaved
                ? t("followUp.summary.saved")
                : saved
                  ? t("followUp.summary.unsaved")
                  : t("followUp.summary.draft")}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button onClick={copy} leftIcon={<DocumentDuplicateIcon aria-hidden="true" className="size-5" />}>
                {t("followUp.summary.copy")}
              </Button>
              <Button variant="secondary" onClick={save} leftIcon={<CheckCircleIcon aria-hidden="true" className="size-5" />}>
                {t("followUp.summary.save")}
              </Button>
              <Button
                variant="secondary"
                onClick={regenerate}
                leftIcon={<ArrowPathIcon aria-hidden="true" className="size-5" />}
              >
                {t("followUp.summary.regenerate")}
              </Button>
            </div>
            <p className="text-sm text-gray-70">{t("followUp.summary.regenerateHint")}</p>
            <p className="text-sm text-gray-70">{t("followUp.summary.noTransmit")}</p>

            <div className="flex flex-col gap-3 border-t border-gray-10 pt-4">
              <p className="text-sm font-semibold text-warning-strong">{t("followUp.simulation.label")}</p>
              <Button
                variant="accent"
                onClick={send}
                leftIcon={<PaperAirplaneIcon aria-hidden="true" className="size-5" />}
                className="self-start"
              >
                {t("followUp.send.button")}
              </Button>
              <SafetyNotice verdict={verdict} />
              {sent && (
                <Alert variant="warning" title={t("followUp.simulation.label")} data-testid="follow-up-sent">
                  <p>{t("followUp.send.notice")}</p>
                  <p className="mt-1">{t("followUp.send.done")}</p>
                </Alert>
              )}
              <p className="text-sm text-gray-70">
                {t("followUp.requests.count", { count: session.careTeamRequests.length })}
              </p>
              <Link href="/care-team" className={buttonVariants({ variant: "ghost", size: "sm", className: "self-start" })}>
                {t("followUp.queue.view")}
              </Link>
            </div>
          </CardContent>
        </Card>

        <CareTeamRequestForm profile={profile} actions={session.actions} />
      </div>
    </div>
  );
}
