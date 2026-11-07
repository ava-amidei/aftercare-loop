"use client";
import { ArrowRight } from "lucide-react";
import type { ActionItem, CareTeamRequest, CareTeamRequestStatus, Language } from "@/lib/types";
import { Badge, Button, Card, type BadgeVariant } from "@/components/ui";
import { careTeamStatusKey, careTeamTypeKey, useT } from "@/lib/i18n";
import { nextStatus } from "@/lib/services/care-team";
import { formatDateTime } from "@/lib/utils/dates";
import { isSeedRequest } from "./care-team-helpers";

const STATUS_VARIANT: Record<CareTeamRequestStatus, BadgeVariant> = {
  submitted: "info",
  in_review: "warning",
  responded: "success",
  closed: "neutral",
};

export interface RequestCardProps {
  request: CareTeamRequest;
  patientName: string;
  language: Language;
  relatedAction?: ActionItem;
  onAdvance: (request: CareTeamRequest) => void;
}

export function RequestCard({ request, patientName, language, relatedAction, onAdvance }: RequestCardProps) {
  const t = useT();
  const seed = isSeedRequest(request);
  const closed = request.status === "closed";
  const next = nextStatus(request.status);

  return (
    <Card padding="sm" className="flex flex-col gap-3" data-testid="care-team-request" data-status={request.status}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="brand" size="sm">
          {t(careTeamTypeKey(request.type))}
        </Badge>
        <Badge variant={STATUS_VARIANT[request.status]} size="sm">
          {t(careTeamStatusKey(request.status))}
        </Badge>
        <Badge variant="neutral" size="sm">
          {seed ? t("careTeam.origin.seed") : t("careTeam.origin.patient", { name: patientName })}
        </Badge>
        <Badge variant="warning" size="sm">
          {t("careTeam.fictional")}
        </Badge>
      </div>

      <p className="text-base font-medium text-ink">{request.summary}</p>

      {relatedAction && (
        <p className="text-sm text-ink-muted">
          {t("careTeam.relatedAction", { description: relatedAction.description })}
        </p>
      )}

      {request.details && (
        <details className="rounded-control border border-border bg-surface-muted p-3 text-sm">
          <summary className="min-h-11 cursor-pointer content-center font-semibold text-brand-800">
            {t("careTeam.showDetails")}
          </summary>
          <p className="mt-2 whitespace-pre-wrap break-words text-ink">{request.details}</p>
        </details>
      )}

      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-muted">
        <span>{t("careTeam.field.submittedAt", { date: formatDateTime(request.createdAt, language) })}</span>
        <span>{t("careTeam.field.updatedAt", { date: formatDateTime(request.updatedAt, language) })}</span>
      </p>

      <div>
        <Button
          size="sm"
          variant="secondary"
          disabled={closed}
          onClick={() => onAdvance(request)}
          rightIcon={closed ? undefined : <ArrowRight aria-hidden="true" className="size-4" />}
        >
          {closed
            ? t("careTeam.closedFinal")
            : t("careTeam.advanceTo", { status: t(careTeamStatusKey(next)) })}
        </Button>
      </div>
    </Card>
  );
}
