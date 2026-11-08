"use client";

import type { StoredEvalRun } from "@/lib/eval/schema";
import { Alert, Badge, Card, CardHeader, CardTitle, ModeBadge } from "@/components/ui";
import { evalKindKey, useT } from "@/lib/i18n";
import { countCases, extractionSourceCounts, formatTimestamp } from "./format";

const KIND_VARIANT = {
  deterministic_synthetic: "info",
  model_based: "accent",
  human_reviewed: "success",
} as const;

export interface RunMetadataProps {
  run: StoredEvalRun;
  /** Card title (defaults to "Run details"). */
  title?: string;
  /** One-line note under the title, e.g. which file the run came from. */
  note?: string;
  /** Unique id prefix when several RunMetadata blocks share a page. */
  idPrefix?: string;
  /** Show the per-patient extraction source line (model-based runs). */
  showSources?: boolean;
}

/** Run identity: id, suite version, timestamp, mode, model and kind — straight from the file. */
export function RunMetadata({ run, title, note, idPrefix = "eval-run", showSources = false }: RunMetadataProps) {
  const t = useT();
  const titleId = `${idPrefix}-title`;
  const sources = showSources ? extractionSourceCounts(run) : null;
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
        <span className="text-gray-70">{t("evaluation.run.modelNone")}</span>
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
          <span className="text-gray-70">
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
        <span className="text-gray-70">{t("evaluation.run.noErrors")}</span>
      ),
    },
  ];

  return (
    <Card role="region" aria-labelledby={titleId} data-run-kind={run.kind}>
      <CardHeader>
        <CardTitle id={titleId}>{title ?? t("evaluation.run.title")}</CardTitle>
        {note && <p className="text-sm text-gray-70">{note}</p>}
      </CardHeader>
      {run.partial && (
        <Alert variant="warning" className="mb-4" data-testid="eval-run-partial">
          <p>{t("evaluation.runs.partial")}</p>
        </Alert>
      )}
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex min-w-0 flex-col gap-1">
            <dt className="text-sm font-medium text-gray-70">{r.label}</dt>
            <dd className="min-w-0 text-base text-gray-90">{r.value}</dd>
          </div>
        ))}
      </dl>
      {sources && (
        <p className="mt-4 text-sm text-gray-70">
          {t("evaluation.runs.liveSources", { live: sources.live, fallback: sources.fallback, skipped: sources.skipped })}
        </p>
      )}
      {showSources && run.kind !== "model_based" && (
        <p className="mt-2 text-sm text-gray-70">{t("evaluation.runs.live.notModel")}</p>
      )}
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
