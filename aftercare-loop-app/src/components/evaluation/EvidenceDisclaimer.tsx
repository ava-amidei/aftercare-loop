"use client";

import type { EvalKind } from "@/lib/types";
import { Alert } from "@/components/ui";
import { useT } from "@/lib/i18n";

/**
 * Prominent limitation notice plus an honest breakdown of evidence types
 * (SPEC §9): automated synthetic tests vs human review vs real users vs projections.
 */
export function EvidenceDisclaimer({ kind, pending = false }: { kind?: EvalKind; pending?: boolean }) {
  const t = useT();
  const automated = kind === "deterministic_synthetic" || kind === "model_based";
  // While the run is loading we don't yet know whether automated results exist.
  const runStatus = (present: boolean) =>
    pending ? "…" : present ? t("evaluation.evidence.thisRun") : t("evaluation.evidence.noneYet");
  const rows = [
    { label: t("evaluation.evidence.automated"), value: runStatus(automated) },
    { label: t("evaluation.evidence.humanReviewed"), value: runStatus(kind === "human_reviewed") },
    { label: t("evaluation.evidence.userTesting"), value: t("evaluation.evidence.noneYet") },
    { label: t("evaluation.evidence.projections"), value: t("evaluation.evidence.noneClaimed") },
  ];
  return (
    <div className="flex flex-col gap-4">
      <Alert variant="warning" title={t("evaluation.disclaimer.title")} data-testid="eval-disclaimer">
        <p className="font-medium">{t("evaluation.disclaimer.text")}</p>
      </Alert>
      <div className="overflow-x-auto rounded-3xl bg-gray-0">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="px-4 pt-3 text-left text-base font-semibold text-gray-90">
            {t("evaluation.evidence.title")}
          </caption>
          <thead>
            <tr className="border-b border-gray-10 text-gray-70">
              <th scope="col" className="px-4 py-2 font-medium">
                {t("evaluation.evidence.type")}
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                {t("evaluation.evidence.status")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-gray-10 last:border-0">
                <th scope="row" className="px-4 py-2 font-normal text-gray-90">
                  {r.label}
                </th>
                <td className="px-4 py-2 font-semibold text-gray-90">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
