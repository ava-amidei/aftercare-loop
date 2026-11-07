"use client";

import Link from "next/link";
import { useState } from "react";
import { Stethoscope } from "lucide-react";
import { OriginBadge } from "@/components/ui/OriginBadge";
import { SourceQuote } from "@/components/ui/SourceQuote";
import type { ActionItem, VisitDocument } from "@/lib/types";
import { actionTypeKey, originKey, useT } from "@/lib/i18n";
import { formatDate } from "@/lib/utils/dates";
import { InlineEmpty, SectionCard } from "./SectionCard";

const MAX_VISIBLE = 4;

function TaskRow({ action, documents }: { action: ActionItem; documents: VisitDocument[] }) {
  const t = useT();
  const [showSource, setShowSource] = useState(false);
  const doc = action.sourceRef ? documents.find((d) => d.id === action.sourceRef?.documentId) : undefined;
  const sourceId = `source-${action.id}`;
  return (
    <li className="flex flex-col gap-2 rounded-control border border-border p-3" data-testid="care-team-task">
      <div className="flex flex-wrap items-center gap-2">
        <OriginBadge origin={action.origin} label={t(originKey(action.origin))} size="sm" />
        <span className="text-xs font-medium tracking-wide text-ink-muted uppercase">
          {t(actionTypeKey(action.type))}
        </span>
      </div>
      <p className="text-base font-medium text-ink">{action.description}</p>
      {action.dueDate && (
        <p className="text-sm text-ink-muted">
          {t("common.dueDate", { date: formatDate(action.dueDate, t.lang) })}
        </p>
      )}
      {action.sourceRef && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-expanded={showSource}
            aria-controls={sourceId}
            onClick={() => setShowSource((v) => !v)}
            className="inline-flex min-h-11 items-center self-start rounded-control px-1 text-sm font-semibold text-brand-800 underline underline-offset-4 hover:text-brand-900"
          >
            {showSource ? t("common.hideSource") : t("common.viewSource")}
          </button>
          {showSource && (
            <div id={sourceId}>
              <SourceQuote
                sourceRef={action.sourceRef}
                document={doc}
                verification={action.sourceVerification}
                contextChars={doc ? 60 : 0}
              />
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * "From your care team": pending, verified, clinician-documented steps.
 * `interpreted` tells us whether to nudge toward Understand or say "all done".
 */
export function CareTeamTasks({
  tasks,
  documents,
  interpreted,
}: {
  tasks: ActionItem[];
  documents: VisitDocument[];
  interpreted: boolean;
}) {
  const t = useT();
  const visible = tasks.slice(0, MAX_VISIBLE);
  const hidden = tasks.length - visible.length;
  const planLink = (label: string) => (
    <Link
      href="/action-plan"
      className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline underline-offset-4"
    >
      {label}
    </Link>
  );
  return (
    <SectionCard
      id="dashboard-care-team"
      title={t("dashboard.tasks.title")}
      subtitle={t("dashboard.tasks.subtitle")}
      icon={<Stethoscope aria-hidden="true" className="size-5" />}
    >
      {tasks.length === 0 ? (
        interpreted ? (
          <InlineEmpty action={planLink(t("dashboard.tasks.viewPlan"))}>{t("dashboard.tasks.emptyDone")}</InlineEmpty>
        ) : (
          <InlineEmpty
            action={
              <Link
                href="/understand"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline underline-offset-4"
              >
                {t("dashboard.start.cta")}
              </Link>
            }
          >
            {t("dashboard.tasks.empty")}
          </InlineEmpty>
        )
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {visible.map((a) => (
              <TaskRow key={a.id} action={a} documents={documents} />
            ))}
          </ul>
          <div>{planLink(hidden > 0 ? t("dashboard.tasks.more", { count: hidden }) : t("dashboard.tasks.viewPlan"))}</div>
        </>
      )}
    </SectionCard>
  );
}
