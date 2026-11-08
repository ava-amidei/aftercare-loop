"use client";

import type { ReactNode } from "react";
import type { EvalKind, EvalMetric, EvalSuite } from "@/lib/types";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Stat } from "@/components/ui";
import { evalKindKey, evalSuiteKey, useT, type TranslationKey } from "@/lib/i18n";
import { formatMetricValue, headlineMetric, metricFraction, suiteEvaluated } from "./format";
import { MetricTable, useMetricLabel } from "./MetricTable";

export interface MetricCardProps {
  suite: EvalSuite;
  metrics: EvalMetric[] | undefined;
  /** Suite-specific extras (confusion matrix, failure list…). */
  children?: ReactNode;
  /** Identity of the run these metrics come from; shown in the card footer. */
  run?: { runId: string; suiteVersion: string; kind: EvalKind };
}

/**
 * Honesty captions (VALIDATION-REPORT fix 4): what a suite actually measures
 * when the run is deterministic. Comprehension answers are simulated from the
 * question record in every run kind, so that caption is always shown.
 */
export function honestyCaptionKey(suite: EvalSuite, kind: EvalKind | undefined): TranslationKey | null {
  if (suite === "comprehension" && kind !== undefined) return "evaluation.honesty.comprehension";
  if (kind !== "deterministic_synthetic") return null;
  if (suite === "instruction_extraction") return "evaluation.honesty.instruction_extraction";
  if (suite === "citation_validity") return "evaluation.honesty.citation_validity";
  return null;
}

/** One card per evaluation suite. Shows "Not evaluated" when the run has no values for it. */
export function MetricCard({ suite, metrics, children, run }: MetricCardProps) {
  const t = useT();
  const label = useMetricLabel();
  const evaluated = suiteEvaluated(metrics);
  const headline = evaluated ? headlineMetric(suite, metrics) : undefined;
  const headlineFraction = headline ? metricFraction(headline) : null;
  const titleId = `eval-suite-${suite}`;
  const honestyKey = honestyCaptionKey(suite, run?.kind);

  return (
    <Card role="region" aria-labelledby={titleId} data-suite={suite} className="flex flex-col gap-4">
      <CardHeader className="mb-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle as="h3" id={titleId}>
            {t(evalSuiteKey(suite))}
          </CardTitle>
          {!evaluated && <Badge variant="neutral">{t("evaluation.notEvaluated")}</Badge>}
        </div>
        <CardDescription className="text-sm">{t(`evaluation.suiteDescription.${suite}`)}</CardDescription>
        {honestyKey && (
          <p className="mt-2 rounded-2xl bg-gray-5 px-3 py-2 text-sm text-gray-90" data-testid="eval-honesty-caption">
            <span className="font-semibold">{t("evaluation.honesty.label")}: </span>
            {t(honestyKey)}
          </p>
        )}
      </CardHeader>
      <CardContent className="gap-4">
        {evaluated && headline ? (
          <Stat
            label={label(headline.name)}
            value={formatMetricValue(headline, t.lang)}
            numerator={headlineFraction?.numerator}
            denominator={headlineFraction?.denominator}
          />
        ) : (
          <Stat label={t(evalSuiteKey(suite))} value={null} />
        )}
        {metrics && metrics.length > 0 && <MetricTable metrics={metrics} caption={t(evalSuiteKey(suite))} />}
        {children}
        {run && (
          <p className="text-xs break-all text-gray-70" data-testid="eval-card-run">
            {t("evaluation.card.runLine", { runId: run.runId, suiteVersion: run.suiteVersion, kind: t(evalKindKey(run.kind)) })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
