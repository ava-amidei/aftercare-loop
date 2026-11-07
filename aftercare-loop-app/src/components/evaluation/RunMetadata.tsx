"use client";

import type { EvalRun } from "@/lib/types";
import { Alert, Badge, Card, CardHeader, CardTitle, ModeBadge } from "@/components/ui";
import { evalKindKey, useT } from "@/lib/i18n";
import { countCases, formatTimestamp } from "./format";

const KIND_VARIANT = {
  deterministic_synthetic: "info",
  model_based: "accent",
  human_reviewed: "success",
} as const;

/** Run identity: id, suite version, timestamp, mode, model and kind — straight from the file. */
export function RunMetadata({ run }: { run: EvalRun }) {
  const t = useT();
  const counts = countCases(run.cases);
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: t("evaluation.run.runId"), value: <span className="font-mono text-sm break-all">{run.runId}</span> },
    { label: t("evaluation.run.suiteVersion"), value: <span className="font-mono text-sm">{run.suiteVersion}</span> },
    {
      label: t("evaluation.run.timestamp"),
      value: <time dateTime={run.timestamp}>{formatTimestamp(run.timestamp, t.lang)}</time>,
    },
    { label: t("evaluation.run.mode"), value: <ModeBadge mode={run.mode} model={run.modelId} /> },
    {
      label: t("evaluation.run.model"),
      value: run.modelId ? (
        <span className="font-mono text-sm">{run.modelId}</span>
      ) : (
        <span className="text-ink-muted">{t("evaluation.run.modelNone")}</span>
      ),
    },
    {
      label: t("evaluation.run.kind"),
      value: (
        <Badge variant={KIND_VARIANT[run.kind]} data-kind={run.kind}>
          {t(evalKindKey(run.kind))}
        </Badge>
      ),
    },
    {
      label: t("evaluation.run.caseCount"),
      value: (
        <span>
          <span className="font-semibold tabular-nums">{run.caseCount}</span>{" "}
          <span className="text-ink-muted">
            ({t("evaluation.run.passedSummary", { passed: counts.passed, failed: counts.failed })})
          </span>
        </span>
      ),
    },
    {
      label: t("evaluation.run.errors"),
      value: run.errors.length ? (
        <span className="font-semibold text-danger-strong tabular-nums">{run.errors.length}</span>
      ) : (
        <span className="text-ink-muted">{t("evaluation.run.noErrors")}</span>
      ),
    },
  ];

  return (
    <Card role="region" aria-labelledby="eval-run-title">
      <CardHeader>
        <CardTitle id="eval-run-title">{t("evaluation.run.title")}</CardTitle>
      </CardHeader>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex min-w-0 flex-col gap-1">
            <dt className="text-sm font-medium text-ink-muted">{r.label}</dt>
            <dd className="min-w-0 text-base text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
      {run.errors.length > 0 && (
        <Alert variant="warning" title={t("evaluation.run.errorsTitle")} className="mt-4">
          <ul className="list-disc pl-5 text-sm">
            {run.errors.map((e, i) => (
              <li key={i} className="break-words">
                {e}
              </li>
            ))}
          </ul>
        </Alert>
      )}
    </Card>
  );
}
