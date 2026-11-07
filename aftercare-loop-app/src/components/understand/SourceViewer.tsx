"use client";
/**
 * SourceViewer — shows a VisitDocument with one passage highlighted by its
 * exact offsets and scrolled into view. Reusable from any page:
 *
 *   const viewer = useSourceViewer();
 *   <button onClick={() => viewer.show(doc, item.sourceRef)}>View source</button>
 *   {viewer.element}
 *
 * The highlight is shown only when `doc.text.slice(start, end) === quote`; a
 * mismatch says so instead of guessing (ARCHITECTURE §2.5).
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CircleCheck, FileText, TriangleAlert } from "lucide-react";
import { Alert, Sheet } from "@/components/ui";
import { useT } from "@/lib/i18n";
import type { SourceRef, VisitDocument } from "@/lib/types";
import { splitForHighlight } from "./source-highlight";

export interface SourceViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: VisitDocument;
  sourceRef?: SourceRef;
  /** Optional context line above the document (e.g. the action description). */
  label?: ReactNode;
}

export function SourceViewer({ open, onOpenChange, document, sourceRef, label }: SourceViewerProps) {
  const t = useT();
  const markRef = useRef<HTMLElement>(null);
  const segments = useMemo(
    () => (document && sourceRef ? splitForHighlight(document, sourceRef) : null),
    [document, sourceRef],
  );

  useEffect(() => {
    if (!open || !segments) return;
    const scroll = () => markRef.current?.scrollIntoView?.({ block: "center", behavior: "smooth" });
    if (typeof window.requestAnimationFrame !== "function") {
      const timer = window.setTimeout(scroll, 0);
      return () => window.clearTimeout(timer);
    }
    const id = window.requestAnimationFrame(scroll);
    return () => window.cancelAnimationFrame(id);
  }, [open, segments]);

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={document?.title ?? t("understand.viewer.title")}
      description={t("understand.viewer.description")}
      closeLabel={t("common.close")}
      className="md:w-[min(40rem,100vw)]"
    >
      <div className="flex flex-col gap-4" data-testid="source-viewer">
        {label && <p className="text-base font-medium text-ink">{label}</p>}
        {!document ? (
          <Alert variant="warning">{t("understand.viewer.noDocument")}</Alert>
        ) : (
          <>
            {sourceRef &&
              (segments ? (
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-success-strong">
                  <CircleCheck aria-hidden="true" className="size-4" />
                  {t("common.verification.verified")}
                </p>
              ) : (
                <Alert variant="warning" icon={<TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />}>
                  {t("understand.viewer.notFound")}
                </Alert>
              ))}
            <p className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
              <FileText aria-hidden="true" className="size-4" />
              {t("understand.document.original")}
            </p>
            <div
              className="rounded-control border border-border bg-surface-muted p-4 font-sans text-base leading-relaxed whitespace-pre-wrap text-ink"
              data-testid="source-viewer-text"
            >
              {segments ? (
                <>
                  {segments.before}
                  <mark
                    ref={markRef}
                    data-testid="source-viewer-highlight"
                    aria-label={t("understand.document.highlight")}
                    className="rounded-sm bg-warning-soft px-0.5 text-ink ring-2 ring-warning/60"
                  >
                    {segments.match}
                  </mark>
                  {segments.after}
                </>
              ) : (
                document.text
              )}
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

export interface SourceViewerController {
  show: (document: VisitDocument | undefined, sourceRef: SourceRef | undefined, label?: ReactNode) => void;
  close: () => void;
  /** Render this once in your component tree. */
  element: ReactNode;
}

/** Small state hook around <SourceViewer/> for "View source" buttons. */
export function useSourceViewer(): SourceViewerController {
  const [state, setState] = useState<{
    open: boolean;
    document?: VisitDocument;
    sourceRef?: SourceRef;
    label?: ReactNode;
  }>({ open: false });
  const show = useCallback<SourceViewerController["show"]>(
    (document, sourceRef, label) => setState({ open: true, document, sourceRef, label }),
    [],
  );
  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);
  const element = (
    <SourceViewer
      open={state.open}
      onOpenChange={(open) => (open ? undefined : close())}
      document={state.document}
      sourceRef={state.sourceRef}
      label={state.label}
    />
  );
  return { show, close, element };
}
