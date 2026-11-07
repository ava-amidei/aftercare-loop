"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import type { CommunicationSummary, PatientSessionState } from "@/lib/types";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ModeBadge,
  OriginBadge,
  SourceQuote,
  buttonVariants,
} from "@/components/ui";
import { barrierKey, originKey, useT } from "@/lib/i18n";
import { isUnverifiedClinicianItem } from "@/lib/store";
import { findActionForLine, isSummaryEmpty, questionOrigin } from "./follow-up-helpers";

export interface SummarySectionsProps {
  summary: CommunicationSummary;
  session: PatientSessionState;
}

function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 id={id} className="text-lg font-semibold text-ink">
      {children}
    </h3>
  );
}

/** Read-only breakdown of the communication summary, with origin labels. */
export function SummarySections({ summary, session }: SummarySectionsProps) {
  const t = useT();
  const { actions, savedQuestions, documents, interpretations } = session;

  if (isSummaryEmpty(summary)) {
    return (
      <Card>
        <EmptyState
          headingLevel="h2"
          icon={<ClipboardList aria-hidden="true" className="size-7" />}
          title={t("followUp.sections.emptyTitle")}
          description={t("followUp.sections.emptyDescription")}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/understand" className={buttonVariants({ variant: "secondary" })}>
                {t("followUp.sections.toUnderstand")}
              </Link>
              <Link href="/action-plan" className={buttonVariants({ variant: "secondary" })}>
                {t("followUp.sections.toPlan")}
              </Link>
            </div>
          }
        />
      </Card>
    );
  }

  const none = <p className="text-base text-ink-muted">{t("followUp.section.none")}</p>;

  // AI-shaped extraction metadata for documents that contributed instructions.
  const metas = Array.from(
    new Map(
      summary.documentedInstructions
        .map((d) => (d.sourceRef ? interpretations[d.sourceRef.documentId]?.meta : undefined))
        .filter((m): m is NonNullable<typeof m> => Boolean(m))
        .map((m) => [`${m.mode}|${m.model ?? ""}`, m] as const),
    ).values(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("followUp.sections.title")}</CardTitle>
        <CardDescription>{t("followUp.sections.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <section aria-labelledby="fu-questions" className="flex flex-col gap-2">
          <SectionHeading id="fu-questions">{t("followUp.section.questions")}</SectionHeading>
          {summary.questions.length === 0 ? (
            none
          ) : (
            <ul className="flex flex-col gap-2">
              {summary.questions.map((q) => {
                const origin = questionOrigin(q, savedQuestions, actions);
                return (
                  <li key={q} className="flex flex-col gap-1 rounded-control border border-border p-3">
                    <span className="text-base text-ink">{q}</span>
                    <OriginBadge origin={origin} label={t(originKey(origin))} size="sm" className="self-start" />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="fu-barriers" className="flex flex-col gap-2">
          <SectionHeading id="fu-barriers">{t("followUp.section.barriers")}</SectionHeading>
          {summary.barriers.length === 0 ? (
            none
          ) : (
            <ul className="flex flex-wrap gap-2">
              {summary.barriers.map((b) => (
                <li key={b} className="flex flex-wrap items-center gap-2 rounded-control border border-border p-2">
                  <span className="text-base text-ink">{t(barrierKey(b))}</span>
                  <OriginBadge origin="patient_selected" label={t("followUp.origin.reported")} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="fu-unresolved" className="flex flex-col gap-2">
          <SectionHeading id="fu-unresolved">{t("followUp.section.unresolved")}</SectionHeading>
          {summary.unresolvedItems.length === 0 ? (
            none
          ) : (
            <ul className="flex flex-col gap-2">
              {summary.unresolvedItems.map((line) => {
                const action = findActionForLine(line, actions);
                return (
                  <li key={line} className="flex flex-col gap-1 rounded-control border border-border p-3">
                    <span className="text-base text-ink">{line}</span>
                    {action && (
                      <span className="flex flex-wrap gap-2">
                        <OriginBadge origin={action.origin} label={t(originKey(action.origin))} size="sm" />
                        {isUnverifiedClinicianItem(action) && (
                          <Badge variant="warning" size="sm">
                            {t("common.verification.unverified")}
                          </Badge>
                        )}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby="fu-instructions" className="flex flex-col gap-2">
          <SectionHeading id="fu-instructions">{t("followUp.section.instructions")}</SectionHeading>
          {metas.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              <span>{t("followUp.instructions.extractedWith")}</span>
              {metas.map((m) => (
                <ModeBadge key={`${m.mode}|${m.model ?? ""}`} mode={m.mode} model={m.model} compact />
              ))}
            </div>
          )}
          {summary.documentedInstructions.length === 0 ? (
            none
          ) : (
            <ul className="flex flex-col gap-3">
              {summary.documentedInstructions.map((d, i) => {
                const doc = d.sourceRef ? documents.find((x) => x.id === d.sourceRef?.documentId) : undefined;
                return (
                  <li key={`${d.description}-${i}`} className="flex flex-col gap-2 rounded-control border border-border p-3">
                    <span className="text-base font-medium text-ink">{d.description}</span>
                    <OriginBadge
                      origin="clinician_documented"
                      label={t(originKey("clinician_documented"))}
                      size="sm"
                      className="self-start"
                    />
                    {d.sourceRef ? (
                      <SourceQuote
                        sourceRef={d.sourceRef}
                        document={doc}
                        verification="verified"
                        viewSourceLabel={t("common.viewSource")}
                      />
                    ) : (
                      <p className="text-sm text-ink-muted">{t("followUp.instructions.noSourceQuote")}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
