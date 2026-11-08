"use client";

import { ChartBarIcon } from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import type { StoredEvalRun } from "@/lib/eval/schema";
import {
  Alert,
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  LoadingRegion,
  OriginBadge,
  PageHeader,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { useT } from "@/lib/i18n";
import { CaseTable } from "./CaseTable";
import { ConfusionMatrixTable } from "./ConfusionMatrixTable";
import { EvidenceDisclaimer } from "./EvidenceDisclaimer";
import { FailureList } from "./FailureList";
import { failedCases } from "./format";
import { MetricCard } from "./MetricCard";
import { RunMetadata } from "./RunMetadata";
import { useLatestEval } from "./use-latest-eval";

export interface EvaluationDashboardProps {
  /** Injected for tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
}

/**
 * Evaluation dashboard (SPEC §12.8). Renders only what /api/eval/latest returns:
 * the scripted run (latest.json) and, when recorded, the model-based run
 * (latest-live.json), each with its own clearly labeled RunMetadata block.
 */
export function EvaluationDashboard({ fetchImpl }: EvaluationDashboardProps) {
  const t = useT();
  const state = useLatestEval(fetchImpl);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t("evaluation.title")}
        description={t("evaluation.subtitle")}
        icon={<ChartBarIcon aria-hidden="true" className="size-6" />}
        actions={
          state.status !== "loading" ? (
            <Button variant="secondary" size="sm" onClick={state.reload} leftIcon={<ArrowPathIcon aria-hidden="true" className="size-4" />}>
              {t("evaluation.reload")}
            </Button>
          ) : undefined
        }
        className="mb-0"
      />

      <EvidenceDisclaimer
        kind={state.status === "ready" ? (state.run ?? state.live)?.kind : undefined}
        pending={state.status === "loading"}
      />

      {state.status === "loading" && (
        <LoadingRegion label={t("evaluation.loading")} className="flex flex-col gap-4">
          <Skeleton className="h-40 w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </LoadingRegion>
      )}

      {state.status === "not_evaluated" && (
        <EmptyState
          icon={<ChartBarIcon aria-hidden="true" className="size-7" />}
          title={t("evaluation.notEvaluated.title")}
          description={
            <span className="flex flex-col items-center gap-2">
              <span>{t("evaluation.notEvaluated.body")}</span>
              <code className="rounded-2xl bg-gray-5 px-3 py-1.5 font-mono text-sm text-gray-90">
                cd aftercare-loop-app &amp;&amp; npm run eval
              </code>
              <span>{t("evaluation.notEvaluated.after")}</span>
            </span>
          }
        />
      )}

      {state.status === "error" && (
        <Alert
          variant="danger"
          title={t("evaluation.loadError")}
          action={
            <Button variant="secondary" size="sm" onClick={state.reload}>
              {t("common.retry")}
            </Button>
          }
        >
          <p>{state.message ?? t("evaluation.loadErrorDetail")}</p>
        </Alert>
      )}

      {state.status === "ready" && <ReadyRuns scripted={state.run} live={state.live} liveError={state.liveError} />}
    </div>
  );
}

function ReadyRuns({
  scripted,
  live,
  liveError,
}: {
  scripted: StoredEvalRun | null;
  live: StoredEvalRun | null;
  liveError?: string;
}) {
  const t = useT();
  return (
    <>
      <section aria-labelledby="eval-runs-title" className="flex flex-col gap-4">
        <h2 id="eval-runs-title" className="text-xl font-semibold text-gray-90">
          {t("evaluation.runs.title")}
        </h2>
        <div className="grid gap-4 xl:grid-cols-2">
          {scripted ? (
            <RunMetadata
              run={scripted}
              title={t("evaluation.runs.scripted.title")}
              note={t("evaluation.runs.scripted.file")}
              idPrefix="eval-run-scripted"
            />
          ) : (
            <MissingRun idPrefix="eval-run-scripted" title={t("evaluation.runs.scripted.title")} body={t("evaluation.runs.scripted.missing")} />
          )}
          {live ? (
            <RunMetadata
              run={live}
              title={t("evaluation.runs.live.title")}
              note={t("evaluation.runs.live.file")}
              idPrefix="eval-run-live"
              showSources
            />
          ) : (
            <MissingRun
              idPrefix="eval-run-live"
              title={t("evaluation.runs.live.title")}
              body={liveError ?? t("evaluation.runs.live.missing")}
              command="AFTERCARE_FORCE_SCRIPTED=false npm run eval -- --mode live --out latest-live.json"
            />
          )}
        </div>
      </section>

      {scripted && live ? (
        <Tabs defaultValue="scripted">
          <TabsList label={t("evaluation.results.label")}>
            <TabsTrigger value="scripted">{t("evaluation.results.scripted")}</TabsTrigger>
            <TabsTrigger value="live">{t("evaluation.results.live")}</TabsTrigger>
          </TabsList>
          <TabsContent value="scripted" className="flex flex-col gap-6">
            <RunResults run={scripted} />
          </TabsContent>
          <TabsContent value="live" className="flex flex-col gap-6">
            <RunResults run={live} />
          </TabsContent>
        </Tabs>
      ) : (
        <RunResults run={(scripted ?? live)!} />
      )}
    </>
  );
}

function MissingRun({ idPrefix, title, body, command }: { idPrefix: string; title: string; body: string; command?: string }) {
  return (
    <Card role="region" aria-labelledby={`${idPrefix}-title`} data-run-missing="true">
      <CardHeader>
        <CardTitle id={`${idPrefix}-title`}>{title}</CardTitle>
      </CardHeader>
      <p className="text-base text-gray-70">{body}</p>
      {command && (
        <code className="mt-3 block rounded-2xl bg-gray-5 px-3 py-1.5 font-mono text-sm break-all text-gray-90">{command}</code>
      )}
    </Card>
  );
}

function RunResults({ run }: { run: StoredEvalRun }) {
  const t = useT();
  const extractionMatrix = run.confusion?.instruction_extraction;
  const safetyMatrix = run.confusion?.safety;
  return (
    <>
      <section aria-labelledby="eval-metrics-title" className="flex flex-col gap-4">
        <h2 id="eval-metrics-title" className="text-xl font-semibold text-gray-90">
          {t("evaluation.metrics.title")}
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <MetricCard suite="instruction_extraction" metrics={run.metrics.instruction_extraction} run={run}>
            {extractionMatrix && <ConfusionMatrixTable suite="instruction_extraction" matrix={extractionMatrix} />}
            <p className="flex flex-wrap items-center gap-2 text-sm text-gray-70">
              <OriginBadge origin="clinician_documented" size="sm" />
              <span>{t("evaluation.groundTruthNote")}</span>
            </p>
            <FailureList failures={failedCases(run, "instruction_extraction")} />
          </MetricCard>
          <MetricCard suite="citation_validity" metrics={run.metrics.citation_validity} run={run}>
            <FailureList failures={failedCases(run, "citation_validity")} />
          </MetricCard>
          <MetricCard suite="safety" metrics={run.metrics.safety} run={run}>
            {safetyMatrix && <ConfusionMatrixTable suite="safety" matrix={safetyMatrix} />}
            <FailureList failures={failedCases(run, "safety")} />
          </MetricCard>
          <MetricCard suite="comprehension" metrics={run.metrics.comprehension} run={run}>
            <FailureList failures={failedCases(run, "comprehension")} />
          </MetricCard>
        </div>
      </section>

      <CaseTable cases={run.cases} />
    </>
  );
}
