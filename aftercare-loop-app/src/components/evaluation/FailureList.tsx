"use client";

import type { EvalCaseResult } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { CasePayload } from "./CasePayload";

/** Expandable list of failed cases for one suite (native <details>, keyboard accessible). */
export function FailureList({ failures }: { failures: EvalCaseResult[] }) {
  const t = useT();
  if (failures.length === 0) {
    return <p className="text-sm text-ink-muted">{t("evaluation.failures.none")}</p>;
  }
  return (
    <details className="rounded-control border border-danger/40 bg-danger-soft p-3">
      <summary className="min-h-11 cursor-pointer content-center font-semibold text-danger-strong">
        {t("evaluation.failures.count", { count: failures.length })}
      </summary>
      <ul className="mt-2 flex flex-col gap-3">
        {failures.map((c) => (
          <li key={c.caseId} className="rounded-control border border-border bg-surface p-3 text-sm">
            <p className="font-mono text-xs break-all text-ink-muted">{c.caseId}</p>
            <p className="mt-1 text-ink">{c.details}</p>
            <CasePayload result={c} />
          </li>
        ))}
      </ul>
    </details>
  );
}
