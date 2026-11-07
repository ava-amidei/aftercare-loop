/**
 * Pure helpers for showing a SourceRef inside its VisitDocument.
 *
 * A passage is only highlighted when the stored offsets point at exactly the
 * stored quote (ARCHITECTURE §2.5). We never "find something close" here: a
 * mismatch is reported so the UI can say the passage could not be located.
 */
import type { SourceRef, VisitDocument } from "@/lib/types";

export interface HighlightSegments {
  before: string;
  match: string;
  after: string;
}

/** True when `ref` belongs to `doc` and `doc.text.slice(start, end) === ref.quote`. */
export function refMatchesDocument(
  doc: Pick<VisitDocument, "id" | "text"> | undefined,
  ref: SourceRef | undefined,
): boolean {
  if (!doc || !ref) return false;
  if (ref.documentId !== doc.id) return false;
  if (!Number.isInteger(ref.start) || !Number.isInteger(ref.end)) return false;
  if (ref.start < 0 || ref.end <= ref.start || ref.end > doc.text.length) return false;
  return doc.text.slice(ref.start, ref.end) === ref.quote;
}

/** Split the document text around a verified passage; null when the ref does not match. */
export function splitForHighlight(
  doc: Pick<VisitDocument, "id" | "text">,
  ref: SourceRef | undefined,
): HighlightSegments | null {
  if (!ref || !refMatchesDocument(doc, ref)) return null;
  return {
    before: doc.text.slice(0, ref.start),
    match: doc.text.slice(ref.start, ref.end),
    after: doc.text.slice(ref.end),
  };
}
