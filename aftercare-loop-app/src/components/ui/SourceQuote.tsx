import { CircleCheck, FileText, TriangleAlert } from "lucide-react";
import type { SourceRef, SourceVerification, VisitDocument } from "@/lib/types";
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
  viewSourceLabel = "View source",
  className,
}: SourceQuoteProps) {
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
    <figure className={cn("flex flex-col gap-2 rounded-control border border-border bg-surface-muted p-3", className)}>
      <blockquote className="border-l-4 border-brand-600 pl-3 text-base leading-relaxed text-ink">
        {excerpt ? (
          <p>
            {excerpt.truncatedStart && <span className="text-ink-subtle">…</span>}
            <span className="text-ink-muted">{excerpt.before}</span>
            <mark data-testid="source-highlight">{excerpt.match}</mark>
            <span className="text-ink-muted">{excerpt.after}</span>
            {excerpt.truncatedEnd && <span className="text-ink-subtle">…</span>}
          </p>
        ) : (
          <p>
            “<mark data-testid="source-highlight">{text}</mark>”
          </p>
        )}
      </blockquote>
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
        {caption && (
          <span className="inline-flex items-center gap-1">
            <FileText aria-hidden="true" className="size-4" />
            {caption}
          </span>
        )}
        {status === "verified" && (
          <span className="inline-flex items-center gap-1 font-medium text-success-strong">
            <CircleCheck aria-hidden="true" className="size-4" />
            Matches your document
          </span>
        )}
        {status === "unverified" && (
          <span className="inline-flex items-center gap-1 font-medium text-warning-strong">
            <TriangleAlert aria-hidden="true" className="size-4" />
            Not verified — needs clarification
          </span>
        )}
        {viewSourceHref ? (
          <a
            href={viewSourceHref}
            className="ml-auto inline-flex min-h-11 items-center font-semibold text-brand-800 underline underline-offset-4 hover:text-brand-900"
          >
            {viewSourceLabel}
          </a>
        ) : onViewSource ? (
          <button
            type="button"
            onClick={onViewSource}
            className="ml-auto inline-flex min-h-11 items-center rounded-control px-1 font-semibold text-brand-800 underline underline-offset-4 hover:text-brand-900"
          >
            {viewSourceLabel}
          </button>
        ) : null}
      </figcaption>
    </figure>
  );
}
