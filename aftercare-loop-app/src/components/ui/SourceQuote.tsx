import { CheckCircleIcon, DocumentTextIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import type { SourceRef, SourceVerification, VisitDocument } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils/cn";
import { excerptAround } from "@/lib/utils/text";

export interface SourceQuoteProps {
  /** The quoted passage. Defaults to `sourceRef.quote`. */
  quote?: string;
  sourceRef?: SourceRef;
  /** When given with `sourceRef`, surrounding text is shown and the quote is checked against the offsets. */
  document?: Pick<VisitDocument, "text" | "title">;
  /** Caption, e.g. "After-Visit Summary — 2026-10-14". Defaults to document.title. */
  documentTitle?: string;
  /** Verification status from source-verification. A failed offset check always downgrades to unverified. */
  verification?: SourceVerification;
  /** Characters of surrounding context (0 = quote only). Default 60. */
  contextChars?: number;
  onViewSource?: () => void;
  viewSourceHref?: string;
  /** Defaults to the localized "View source". */
  viewSourceLabel?: string;
  className?: string;
}

/** Shows a document passage with the quoted text highlighted, plus a "View source" affordance. */
export function SourceQuote({
  quote,
  sourceRef,
  document,
  documentTitle,
  verification,
  contextChars = 60,
  onViewSource,
  viewSourceHref,
  viewSourceLabel,
  className,
}: SourceQuoteProps) {
  const t = useT();
  const viewLabel = viewSourceLabel ?? t("common.viewSource");
  const text = quote ?? sourceRef?.quote ?? "";
  const offsetsMatch =
    document && sourceRef ? document.text.slice(sourceRef.start, sourceRef.end) === sourceRef.quote : undefined;
  const status: SourceVerification | undefined = offsetsMatch === false ? "unverified" : verification;
  const excerpt =
    document && sourceRef && offsetsMatch && contextChars > 0
      ? excerptAround(document.text, sourceRef.start, sourceRef.end, contextChars)
      : null;
  const caption = documentTitle ?? document?.title;

  return (
    <figure className={cn("flex flex-col gap-2 rounded-2xl bg-gray-5 p-3", className)}>
      <blockquote className="border-l-4 border-primary pl-3 text-base leading-relaxed text-gray-90">
        {excerpt ? (
          <p>
            {excerpt.truncatedStart && <span className="text-gray-60">…</span>}
            <span className="text-gray-70">{excerpt.before}</span>
            <mark data-testid="source-highlight">{excerpt.match}</mark>
            <span className="text-gray-70">{excerpt.after}</span>
            {excerpt.truncatedEnd && <span className="text-gray-60">…</span>}
          </p>
        ) : (
          <p>
            “<mark data-testid="source-highlight">{text}</mark>”
          </p>
        )}
      </blockquote>
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-70">
        {caption && (
          <span className="inline-flex items-center gap-1">
            <DocumentTextIcon aria-hidden="true" className="size-4" />
            {caption}
          </span>
        )}
        {status === "verified" && (
          <span className="inline-flex items-center gap-1 font-medium text-success-strong">
            <CheckCircleIcon aria-hidden="true" className="size-4" />
            {t("common.verification.verified")}
          </span>
        )}
        {status === "unverified" && (
          <span className="inline-flex items-center gap-1 font-medium text-warning-strong">
            <ExclamationTriangleIcon aria-hidden="true" className="size-4" />
            {t("common.verification.needsClarification")}
          </span>
        )}
        {viewSourceHref ? (
          <a
            href={viewSourceHref}
            className="ml-auto inline-flex min-h-11 items-center font-semibold text-primary-800 underline underline-offset-4 hover:text-primary-900"
          >
            {viewLabel}
          </a>
        ) : onViewSource ? (
          <button
            type="button"
            onClick={onViewSource}
            className="ml-auto inline-flex min-h-11 items-center rounded-full px-1 font-semibold text-primary-800 underline underline-offset-4 hover:text-primary-900"
          >
            {viewLabel}
          </button>
        ) : null}
      </figcaption>
    </figure>
  );
}
