"use client";

import type { EvalCaseResult } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { formatPayload } from "./format";

/** Collapsible expected / actual payloads stored with a case (rendered verbatim, never interpreted). */
export function CasePayload({ result }: { result: EvalCaseResult }) {
  const t = useT();
  if (result.expected === undefined && result.actual === undefined) return null;
  return (
    <details className="mt-2">
      <summary className="min-h-11 cursor-pointer content-center text-sm font-medium text-brand-800">
        {t("evaluation.case.showPayload")}
      </summary>
      <div className="mt-1 grid gap-2 md:grid-cols-2">
        {result.expected !== undefined && (
          <div>
            <p className="text-xs font-semibold text-ink-muted">{t("evaluation.case.expected")}</p>
            <pre className="max-h-64 overflow-auto rounded-control bg-surface-muted p-2 text-xs whitespace-pre-wrap break-words">
              {formatPayload(result.expected)}
            </pre>
          </div>
        )}
        {result.actual !== undefined && (
          <div>
            <p className="text-xs font-semibold text-ink-muted">{t("evaluation.case.actual")}</p>
            <pre className="max-h-64 overflow-auto rounded-control bg-surface-muted p-2 text-xs whitespace-pre-wrap break-words">
              {formatPayload(result.actual)}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}
