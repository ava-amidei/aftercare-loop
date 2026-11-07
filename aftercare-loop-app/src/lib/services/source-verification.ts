/**
 * Source verification (ARCHITECTURE §2.5, §5) — pure, no AI.
 *
 * A clinician-documented item is "verified" only when
 * `document.text.slice(ref.start, ref.end) === ref.quote` for a ref that points
 * at THIS document. `locateQuote` finds a quote's exact offsets: exact match
 * first, then a whitespace/case/punctuation/diacritic-insensitive search whose
 * hit is mapped back to EXACT offsets in the original text (the returned quote
 * is always the original slice, so it re-verifies exactly).
 */
import type { DocumentSection, SourceRef, SourceVerification, VisitDocument } from "@/lib/types";

type DocLike = Pick<VisitDocument, "id" | "text"> & { sections?: DocumentSection[] };

// ---------------------------------------------------------------------------
// Exact verification
// ---------------------------------------------------------------------------

/** "verified" iff the ref targets this document and its offsets slice exactly to its quote. */
export function verifySourceRef(doc: DocLike, ref: SourceRef | null | undefined): SourceVerification {
  if (!ref || typeof ref !== "object") return "unverified";
  if (ref.documentId !== doc.id) return "unverified";
  const { start, end, quote } = ref;
  if (!Number.isInteger(start) || !Number.isInteger(end)) return "unverified";
  if (start < 0 || end <= start || end > doc.text.length) return "unverified";
  if (typeof quote !== "string" || quote.trim().length === 0) return "unverified";
  return doc.text.slice(start, end) === quote ? "verified" : "unverified";
}

/** Section containing [start, end), if the document declares sections. */
export function sectionIdFor(doc: DocLike, start: number, end: number): string | undefined {
  return doc.sections?.find((s) => s.start <= start && end <= s.end)?.id;
}

function makeRef(doc: DocLike, start: number, end: number): SourceRef {
  const sectionId = sectionIdFor(doc, start, end);
  return {
    documentId: doc.id,
    start,
    end,
    quote: doc.text.slice(start, end),
    ...(sectionId ? { sectionId } : {}),
  };
}

// ---------------------------------------------------------------------------
// Normalization with an index map back to the original text
// ---------------------------------------------------------------------------

const WORD_CHAR = /[\p{L}\p{N}]/u;
const COMBINING = /\p{M}/gu;

export interface NormalizedText {
  /** Lowercased, diacritic-free; every non-alphanumeric run collapsed to one space; trimmed. */
  text: string;
  /** For each char of `text`: start offset (UTF-16) of the original code point it came from. */
  origStart: number[];
  /** For each char of `text`: end offset (exclusive) of the original code point it came from. */
  origEnd: number[];
}

/** Normalize text while recording, per output char, the original span it came from. */
export function normalizeWithMap(input: string): NormalizedText {
  let text = "";
  const origStart: number[] = [];
  const origEnd: number[] = [];
  let i = 0;
  while (i < input.length) {
    const cp = input.codePointAt(i)!;
    const width = cp > 0xffff ? 2 : 1;
    const raw = input.slice(i, i + width);
    const folded = raw.normalize("NFKD").replace(COMBINING, "").toLowerCase();
    for (const ch of folded) {
      if (WORD_CHAR.test(ch)) {
        text += ch;
        origStart.push(i);
        origEnd.push(i + width);
      } else if (text.length > 0 && text[text.length - 1] !== " ") {
        text += " ";
        origStart.push(i);
        origEnd.push(i + width);
      }
    }
    i += width;
  }
  if (text.endsWith(" ")) {
    text = text.slice(0, -1);
    origStart.pop();
    origEnd.pop();
  }
  return { text, origStart, origEnd };
}

/** Normalized form only (same rules as `normalizeWithMap`). */
export function normalizeForMatch(input: string): string {
  return normalizeWithMap(input).text;
}

function isPunct(ch: string | undefined): boolean {
  return ch !== undefined && !/\s/.test(ch) && !WORD_CHAR.test(ch);
}

function countLeadingPunct(s: string): number {
  let n = 0;
  while (n < s.length && isPunct(s[n])) n++;
  return n;
}

function countTrailingPunct(s: string): number {
  let n = 0;
  while (n < s.length && isPunct(s[s.length - 1 - n])) n++;
  return n;
}

/** All boundary-aligned positions of `needle` in normalized `hay` (whole words only). */
function findAligned(hay: string, needle: string, max: number): number[] {
  const hits: number[] = [];
  let from = 0;
  while (hits.length < max) {
    const pos = hay.indexOf(needle, from);
    if (pos < 0) break;
    const before = pos === 0 || hay[pos - 1] === " ";
    const afterIdx = pos + needle.length;
    const after = afterIdx === hay.length || hay[afterIdx] === " ";
    if (before && after) hits.push(pos);
    from = pos + 1;
  }
  return hits;
}

// ---------------------------------------------------------------------------
// locateQuote
// ---------------------------------------------------------------------------

export interface LocateOptions {
  /**
   * What to do when the quote occurs more than once. Default "null": an
   * ambiguous quote cannot be traced to one location, so it is not located.
   * "first" is for non-instruction uses such as term highlighting.
   */
  onAmbiguous?: "null" | "first";
}

/**
 * Find `quote` in the document and return an exact SourceRef, or null when it
 * is not found or is ambiguous. The returned `quote` is always the original
 * slice `doc.text.slice(start, end)`, so `verifySourceRef` passes on it.
 */
export function locateQuote(doc: DocLike, quote: string, opts: LocateOptions = {}): SourceRef | null {
  if (typeof quote !== "string" || typeof doc.text !== "string") return null;
  const pickFirst = opts.onAmbiguous === "first";
  const trimmed = quote.trim();
  if (!trimmed) return null;

  // 1. Exact match (trimmed quote; surrounding whitespace is never meaningful).
  const exact = doc.text.indexOf(trimmed);
  if (exact >= 0) {
    const again = doc.text.indexOf(trimmed, exact + 1);
    if (again >= 0 && !pickFirst) return null;
    return makeRef(doc, exact, exact + trimmed.length);
  }

  // 2. Normalized fallback, mapped back to exact original offsets.
  const needle = normalizeForMatch(trimmed);
  if (!needle) return null;
  const hay = normalizeWithMap(doc.text);
  const hits = findAligned(hay.text, needle, pickFirst ? 1 : 2);
  if (hits.length === 0) return null;
  if (hits.length > 1 && !pickFirst) return null;

  const pos = hits[0]!;
  let start = hay.origStart[pos]!;
  let end = hay.origEnd[pos + needle.length - 1]!;

  // Re-attach punctuation the quote carried at its edges (e.g. a final ".")
  // when the original text has punctuation in the same place.
  let lead = countLeadingPunct(trimmed);
  while (lead > 0 && isPunct(doc.text[start - 1])) {
    start--;
    lead--;
  }
  let trail = countTrailingPunct(trimmed);
  while (trail > 0 && isPunct(doc.text[end])) {
    end++;
    trail--;
  }
  return makeRef(doc, start, end);
}

// ---------------------------------------------------------------------------
// Batch verification
// ---------------------------------------------------------------------------

export interface VerifiableItem {
  sourceRef?: SourceRef;
  sourceVerification: SourceVerification;
  /** Quote that was claimed but could not be matched to the document text. */
  unverifiedQuote?: string;
}

/**
 * Re-verify every item against the document:
 *  - ref slices exactly → "verified" (upgrade allowed);
 *  - otherwise the claimed quote is re-located (exact, then normalized) and the
 *    ref is replaced with the exact one → "verified";
 *  - otherwise → "unverified", the bogus ref is removed (a SourceRef must
 *    always slice to its quote) and the claimed text is kept in `unverifiedQuote`.
 * Items with no ref stay "not_applicable" if they were, else become "unverified".
 */
export function verifySourceRefs<T extends VerifiableItem>(doc: DocLike, items: readonly T[]): T[] {
  return items.map((item) => {
    const ref = item.sourceRef;
    if (!ref) {
      if (item.sourceVerification === "not_applicable") return item;
      return { ...item, sourceVerification: "unverified" };
    }
    if (verifySourceRef(doc, ref) === "verified") {
      const { unverifiedQuote: _drop, ...rest } = item;
      void _drop;
      return { ...rest, sourceRef: ref, sourceVerification: "verified" } as T;
    }
    const located = ref.documentId === doc.id || !ref.documentId ? locateQuote(doc, ref.quote ?? "") : null;
    if (located) {
      const { unverifiedQuote: _drop, ...rest } = item;
      void _drop;
      return { ...rest, sourceRef: located, sourceVerification: "verified" } as T;
    }
    const { sourceRef: _ref, ...rest } = item;
    void _ref;
    const claimed = typeof ref.quote === "string" && ref.quote.trim() ? ref.quote : undefined;
    return {
      ...rest,
      sourceVerification: "unverified",
      ...(claimed ? { unverifiedQuote: claimed } : {}),
    } as T;
  });
}
