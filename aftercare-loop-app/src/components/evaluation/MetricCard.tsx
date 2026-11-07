"use client";

import type { ReactNode } from "react";
import type { EvalMetric, EvalSuite } from "@/lib/types";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Stat } from "@/components/ui";
import { evalSuiteKey, useT } from "@/lib/i18n";
import { formatMetricValue, headlineMetric, metricFraction, suiteEvaluated } from "./format";
import { MetricTable, useMetricLabel } from "./MetricTable";

export interface MetricCardProps {
  suite: EvalSuite;
  metrics: EvalMetric[] | undefined;
  /** Suite-specific extras (confusion matrix, failure list…). */
  children?: ReactNode;
}

/** One card per evaluation suite. Shows "Not evaluated" when the run has no values for it. */
export function MetricCard({ suite, metrics, children }: MetricCardProps) {
  const t = useT();
  const label = useMetricLabel();
  const evaluated = suiteEvaluated(metrics);
  const headline = evaluated ? headlineMetric(suite, metrics) : undefined;
  const headlineFraction = headline ? metricFraction(headline) : null;
  const titleId = `eval-suite-${suite}`;

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
      </CardContent>
    </Card>
  );
}
