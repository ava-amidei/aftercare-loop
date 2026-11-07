import { describe, expect, it } from "vitest";
import type { SourceRef } from "@/lib/types";
import { refMatchesDocument, splitForHighlight } from "./source-highlight";

const doc = { id: "doc-1", text: "Line one.\nTake the tablet twice daily.\nLine three." };
const start = doc.text.indexOf("Take the tablet");
const quote = "Take the tablet twice daily.";
const ref: SourceRef = { documentId: "doc-1", start, end: start + quote.length, quote };

describe("refMatchesDocument", () => {
  it("accepts exact offsets", () => {
    expect(refMatchesDocument(doc, ref)).toBe(true);
  });
  it("rejects shifted offsets, wrong quote, wrong document and bad ranges", () => {
    expect(refMatchesDocument(doc, { ...ref, start: ref.start + 1 })).toBe(false);
    expect(refMatchesDocument(doc, { ...ref, quote: "Take the pill twice daily." })).toBe(false);
    expect(refMatchesDocument(doc, { ...ref, documentId: "doc-2" })).toBe(false);
    expect(refMatchesDocument(doc, { ...ref, start: 5, end: 5, quote: "" })).toBe(false);
    expect(refMatchesDocument(doc, { ...ref, end: 10_000 })).toBe(false);
    expect(refMatchesDocument(undefined, ref)).toBe(false);
    expect(refMatchesDocument(doc, undefined)).toBe(false);
  });
});

describe("splitForHighlight", () => {
  it("splits around the passage so the pieces rebuild the document", () => {
    const seg = splitForHighlight(doc, ref)!;
    expect(seg.match).toBe(quote);
    expect(seg.before + seg.match + seg.after).toBe(doc.text);
  });
  it("returns null instead of guessing when offsets do not match", () => {
    expect(splitForHighlight(doc, { ...ref, start: 0, end: quote.length })).toBeNull();
  });
});
