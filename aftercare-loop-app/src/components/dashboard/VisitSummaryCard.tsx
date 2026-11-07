"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ModeBadge } from "@/components/ui/ModeBadge";
import type { DocumentInterpretation, VisitDocument } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { InlineEmpty, SectionCard } from "./SectionCard";

/** Latest (active) visit summary and whether it has been interpreted yet. */
export function VisitSummaryCard({
  document,
  interpretation,
}: {
  document?: VisitDocument;
  interpretation?: DocumentInterpretation;
}) {
  const t = useT();
  const link = (
    <Link
      href="/understand"
      className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline underline-offset-4"
    >
      {document ? t("dashboard.document.open") : t("dashboard.start.cta")}
    </Link>
  );
  return (
    <SectionCard
      id="dashboard-document"
      title={t("dashboard.document.title")}
      icon={<FileText aria-hidden="true" className="size-5" />}
    >
      {!document ? (
        <InlineEmpty action={link}>{t("dashboard.document.empty")}</InlineEmpty>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-base font-medium text-ink">{document.title}</p>
          <div className="flex flex-wrap items-center gap-2">
            {interpretation ? (
              <>
                <Badge variant="success" size="sm">{t("dashboard.document.reviewed")}</Badge>
                {/* The interpretation is AI-shaped content: always disclose its mode. */}
                <ModeBadge mode={interpretation.meta.mode} model={interpretation.meta.model} compact />
              </>
            ) : (
              <Badge variant="neutral" size="sm">{t("dashboard.document.notReviewed")}</Badge>
            )}
          </div>
          <div>{link}</div>
        </div>
      )}
    </SectionCard>
  );
}
