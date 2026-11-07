"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardCheck, ListChecks } from "lucide-react";
import { Alert, Button, Card, buttonVariants } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { useDemoStore } from "@/lib/store";
import type { DocumentInterpretation, PatientSessionState, VisitDocument } from "@/lib/types";
import { requestActionPlan } from "./api";

export interface CtaRowProps {
  session: PatientSessionState;
  document: VisitDocument;
  interpretation: DocumentInterpretation;
}

/** "Check my understanding" → /check; "Build my action plan" → /api/action-plan → upsertActions → /action-plan. */
export function CtaRow({ session, document, interpretation }: CtaRowProps) {
  const t = useT();
  const router = useRouter();
  const upsertActions = useDemoStore((s) => s.upsertActions);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function buildPlan() {
    setStatus("loading");
    try {
      const actions = await requestActionPlan(session, document, interpretation);
      upsertActions(session.profile.id, actions);
      setStatus("idle");
      router.push("/action-plan");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Card tone="brand" data-testid="understand-cta">
      <h2 className="mb-3 text-lg font-semibold text-ink">{t("understand.cta.title")}</h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href="/check" className={buttonVariants({ variant: "secondary", className: "gap-2" })}>
          <ClipboardCheck aria-hidden="true" className="size-5" />
          {t("understand.cta.check")}
        </Link>
        <Button
          onClick={() => void buildPlan()}
          loading={status === "loading"}
          loadingLabel={t("understand.cta.planBuilding")}
          leftIcon={<ListChecks aria-hidden="true" className="size-5" />}
        >
          {status === "loading" ? t("understand.cta.planBuilding") : t("understand.cta.plan")}
        </Button>
      </div>
      {status === "error" && (
        <Alert
          className="mt-3"
          variant="danger"
          title={t("understand.cta.planError")}
          action={
            <Button variant="secondary" size="sm" onClick={() => void buildPlan()}>
              {t("understand.retry")}
            </Button>
          }
        >
          {t("common.errorDetail")}
        </Alert>
      )}
    </Card>
  );
}
