"use client";
import type { SafetyVerdict } from "@/lib/types";
import { Alert } from "@/components/ui";
import { useT } from "@/lib/i18n";

/** Shown when deterministic safety rules flag text typed for the simulated queue. */
export function SafetyNotice({ verdict }: { verdict: SafetyVerdict | null }) {
  const t = useT();
  if (!verdict || verdict.level === "none") return null;
  return (
    <Alert
      variant={verdict.level === "emergency" ? "danger" : "warning"}
      title={t("followUp.request.urgentTitle")}
      live
      data-testid="follow-up-safety"
    >
      {verdict.guidance && <p className="whitespace-pre-line">{verdict.guidance}</p>}
      <p className="mt-1">{t("followUp.request.urgentQueue")}</p>
    </Alert>
  );
}
