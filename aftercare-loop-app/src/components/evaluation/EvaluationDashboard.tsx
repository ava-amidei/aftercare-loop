"use client";

import { ChartBarIcon } from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import type { EvalRun } from "@/lib/types";
import {
  Alert,
  Button,
  EmptyState,
  LoadingRegion,
  OriginBadge,
  PageHeader,
  Skeleton,
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

/** Evaluation dashboard (SPEC §12.8). Renders only what /api/eval/latest returns. */
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
        kind={state.status === "ready" ? state.run.kind : undefined}
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

      {state.status === "ready" && <RunResults run={state.run} />}
    </div>
  );
}

function RunResults({ run }: { run: EvalRun }) {
  const t = useT();
  const extractionMatrix = run.confusion?.instruction_extraction;
  const safetyMatrix = run.confusion?.safety;
  return (
    <>
      <RunMetadata run={run} />

      <section aria-labelledby="eval-metrics-title" className="flex flex-col gap-4">
        <h2 id="eval-metrics-title" className="text-xl font-semibold text-gray-90">
          {t("evaluation.metrics.title")}
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <MetricCard suite="instruction_extraction" metrics={run.metrics.instruction_extraction}>
            {extractionMatrix && <ConfusionMatrixTable suite="instruction_extraction" matrix={extractionMatrix} />}
            <p className="flex flex-wrap items-center gap-2 text-sm text-gray-70">
              <OriginBadge origin="clinician_documented" size="sm" />
              <span>{t("evaluation.groundTruthNote")}</span>
            </p>
            <FailureList failures={failedCases(run, "instruction_extraction")} />
          </MetricCard>
          <MetricCard suite="citation_validity" metrics={run.metrics.citation_validity}>
            <FailureList failures={failedCases(run, "citation_validity")} />
          </MetricCard>
          <MetricCard suite="safety" metrics={run.metrics.safety}>
            {safetyMatrix && <ConfusionMatrixTable suite="safety" matrix={safetyMatrix} />}
            <FailureList failures={failedCases(run, "safety")} />
          </MetricCard>
          <MetricCard suite="comprehension" metrics={run.metrics.comprehension}>
            <FailureList failures={failedCases(run, "comprehension")} />
          </MetricCard>
        </div>
      </section>

      <CaseTable cases={run.cases} />
    </>
  );
}
