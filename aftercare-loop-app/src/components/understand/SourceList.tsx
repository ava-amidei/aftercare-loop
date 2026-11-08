"use client";
import { ArrowTopRightOnSquareIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { Badge, type BadgeVariant } from "@/components/ui";
import { evidenceKindKey, useT } from "@/lib/i18n";
import type { EvidenceKind, ReferenceId } from "@/lib/types";
import { formatDate } from "@/lib/utils/dates";
import { resolveReferences } from "./result-model";

const KIND_VARIANT: Record<EvidenceKind, BadgeVariant> = {
  clinical_guideline: "brand",
  patient_education: "info",
  government_resource: "neutral",
  peer_reviewed: "success",
};

export interface SourceListProps {
  referenceIds: readonly ReferenceId[] | undefined;
  className?: string;
}

/** Curated references only: clickable (new tab), kind badge, and a "Not verified" note when none. */
export function SourceList({ referenceIds, className }: SourceListProps) {
  const t = useT();
  const { references, missing } = resolveReferences(referenceIds);

  if (references.length === 0) {
    return (
      <div className={className} data-testid="sources-not-verified">
        <p className="flex items-start gap-2 text-base text-gray-90">
          <ShieldExclamationIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning" />
          <span>
            <Badge variant="warning" size="sm" className="mr-2 align-middle">
              {t("understand.sources.notVerified")}
            </Badge>
            {t("understand.sources.notVerifiedNote")}
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ul className="flex flex-col gap-3" data-testid="source-list">
        {references.map((ref) => (
          <li key={ref.id} className="rounded-2xl bg-gray-5 p-3">
            <a
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t("understand.sources.open", { title: ref.title })} ${t("common.opensInNewTab")}`}
              className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary-800 underline underline-offset-4 hover:text-primary-900"
            >
              {ref.title}
              <ArrowTopRightOnSquareIcon aria-hidden="true" className="size-4 shrink-0" />
            </a>
            <p className="text-sm text-gray-70">{ref.organization}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={KIND_VARIANT[ref.kind]} size="sm">
                {t(evidenceKindKey(ref.kind))}
              </Badge>
              {ref.publisherType === "government" && ref.kind !== "government_resource" && (
                <Badge variant="neutral" size="sm">
                  {t("understand.sources.government")}
                </Badge>
              )}
              <span className="text-xs text-gray-70">
                {ref.publishedOrUpdated
                  ? t("understand.source.updated", { date: formatDate(ref.publishedOrUpdated, t.lang) })
                  : t("understand.source.accessed", { date: formatDate(ref.accessedAt, t.lang) })}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {missing.length > 0 && <p className="mt-3 text-sm text-gray-70">{t("understand.sources.unknownRemoved")}</p>}
    </div>
  );
}
