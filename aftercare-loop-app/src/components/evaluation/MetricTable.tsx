"use client";

import type { EvalMetric } from "@/lib/types";
import { isTranslationKey, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import { METRIC_NAME_KEYS, formatMetricValue, metricFraction } from "./format";

/** Translated label for a metric name from the run file; unknown names render as-is. */
export function useMetricLabel(): (name: string) => string {
  const t = useT();
  return (name: string) => {
    const key = METRIC_NAME_KEYS[name];
    return key && isTranslationKey(key) ? t(key) : name;
  };
}

export interface MetricTableProps {
  metrics: EvalMetric[];
  caption: string;
  className?: string;
}

/** Every metric in a suite, exactly as stored: name, result, numerator / denominator. */
export function MetricTable({ metrics, caption, className }: MetricTableProps) {
  const t = useT();
  const label = useMetricLabel();
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[18rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border text-ink-muted">
            <th scope="col" className="py-2 pr-3 font-medium">
              {t("evaluation.table.metric")}
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              {t("evaluation.table.result")}
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              {t("evaluation.table.counts")}
            </th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => {
            const value = formatMetricValue(m, t.lang);
            const fraction = metricFraction(m);
            return (
              <tr key={m.name} className="border-b border-border/70 last:border-0">
                <th scope="row" className="py-2 pr-3 font-normal text-ink">
                  {label(m.name)}
                </th>
                <td className="py-2 pr-3 text-right font-semibold tabular-nums text-ink">
                  {value ?? <span className="font-normal text-ink-subtle">{t("evaluation.notEvaluated")}</span>}
                </td>
                <td className="py-2 text-right tabular-nums text-ink-muted">
                  {fraction ? t("evaluation.fraction", { ...fraction }) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
