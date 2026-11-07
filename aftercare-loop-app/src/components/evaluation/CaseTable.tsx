"use client";

import { useId, useMemo, useState } from "react";
import { CircleCheck, CircleX } from "lucide-react";
import type { EvalCaseResult } from "@/lib/types";
import { Badge, Card, CardHeader, CardTitle, EmptyState, Select } from "@/components/ui";
import { evalSuiteKey, useT } from "@/lib/i18n";
import { CasePayload } from "./CasePayload";
import { EVAL_SUITES, filterCases, type CaseStatusFilter, type CaseSuiteFilter } from "./format";

/** Per-case results with suite and pass/fail filters. Simple accessible table; no charts. */
export function CaseTable({ cases }: { cases: EvalCaseResult[] }) {
  const t = useT();
  const [suite, setSuite] = useState<CaseSuiteFilter>("all");
  const [status, setStatus] = useState<CaseStatusFilter>("all");
  const shown = useMemo(() => filterCases(cases, { suite, status }), [cases, suite, status]);
  const countId = useId();

  return (
    <Card role="region" aria-labelledby="eval-cases-title">
      <CardHeader>
        <CardTitle id="eval-cases-title">{t("evaluation.cases")}</CardTitle>
      </CardHeader>
      {cases.length === 0 ? (
        <EmptyState headingLevel="h3" title={t("evaluation.cases.none")} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label={t("evaluation.cases.filterSuite")}
              value={suite}
              onChange={(e) => setSuite(e.target.value as CaseSuiteFilter)}
              aria-controls="eval-cases-table"
              options={[
                { value: "all", label: t("evaluation.cases.allSuites") },
                ...EVAL_SUITES.map((s) => ({ value: s, label: t(evalSuiteKey(s)) })),
              ]}
            />
            <Select
              label={t("evaluation.cases.filterStatus")}
              value={status}
              onChange={(e) => setStatus(e.target.value as CaseStatusFilter)}
              aria-controls="eval-cases-table"
              options={[
                { value: "all", label: t("evaluation.cases.allResults") },
                { value: "passed", label: t("evaluation.cases.onlyPassed") },
                { value: "failed", label: t("evaluation.cases.onlyFailed") },
              ]}
            />
          </div>
          <p id={countId} role="status" aria-live="polite" className="text-sm text-ink-muted">
            {t("evaluation.cases.showing", { shown: shown.length, total: cases.length })}
          </p>
          {shown.length === 0 ? (
            <EmptyState headingLevel="h3" title={t("evaluation.cases.empty")} />
          ) : (
            <div className="overflow-x-auto">
              <table id="eval-cases-table" aria-describedby={countId} className="w-full min-w-[40rem] border-collapse text-left text-sm">
                <caption className="sr-only">{t("evaluation.cases")}</caption>
                <thead>
                  <tr className="border-b border-border text-ink-muted">
                    <th scope="col" className="py-2 pr-3 font-medium">{t("evaluation.case.id")}</th>
                    <th scope="col" className="py-2 pr-3 font-medium">{t("evaluation.case.suite")}</th>
                    <th scope="col" className="py-2 pr-3 font-medium">{t("evaluation.case.result")}</th>
                    <th scope="col" className="py-2 font-medium">{t("evaluation.case.details")}</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((c) => (
                    <tr key={c.caseId} data-testid="eval-case-row" className="border-b border-border/70 align-top last:border-0">
                      <th scope="row" className="py-2 pr-3 font-mono text-xs font-normal break-all text-ink">
                        {c.caseId}
                      </th>
                      <td className="py-2 pr-3 text-ink-muted">{t(evalSuiteKey(c.suite))}</td>
                      <td className="py-2 pr-3">
                        {c.passed ? (
                          <Badge size="sm" variant="success" icon={<CircleCheck aria-hidden="true" className="size-3.5" />}>
                            {t("evaluation.case.passed")}
                          </Badge>
                        ) : (
                          <Badge size="sm" variant="danger" icon={<CircleX aria-hidden="true" className="size-3.5" />}>
                            {t("evaluation.case.failed")}
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 text-ink">
                        <p className="break-words">{c.details}</p>
                        <CasePayload result={c} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
