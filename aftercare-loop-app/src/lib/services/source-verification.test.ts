import { describe, expect, it } from "vitest";
import type { SourceRef, VisitDocument } from "@/lib/types";
import {
  locateQuote,
  normalizeForMatch,
  normalizeWithMap,
  verifySourceRef,
  verifySourceRefs,
  type VerifiableItem,
} from "./source-verification";

const text = [
  "After-Visit Summary",
  "Fictional demonstration record.",
  "",
  "Follow-up instructions",
  "- Schedule a follow-up   visit in 3 months.",
  "- Don’t skip your morning dose.",
  "Hágase la prueba de glucosa antes del 15 de diciembre de 2026.",
  "Bring your log.",
  "Bring your log.",
  "",
].join("\n");

const doc: VisitDocument = {
  id: "doc-test-1",
  patientId: "pt-test",
  title: "Test",
  text,
  createdAt: "2026-10-14",
  source: "pasted",
  sections: [{ id: "follow-up-instructions", heading: "Follow-up instructions", start: text.indexOf("Follow-up instructions"), end: text.length - 1 }],
};

function exact(quote: string): SourceRef {
  const start = text.indexOf(quote);
  return { documentId: doc.id, start, end: start + quote.length, quote };
}

describe("verifySourceRef", () => {
  it("verifies an exact slice", () => {
    expect(verifySourceRef(doc, exact("Bring your log."))).toBe("verified");
  });

  it("rejects mismatched offsets, other documents, bad bounds and empty quotes", () => {
    const ref = exact("Hágase la prueba");
    expect(verifySourceRef(doc, { ...ref, start: ref.start + 1 })).toBe("unverified");
    expect(verifySourceRef(doc, { ...ref, documentId: "doc-other" })).toBe("unverified");
    expect(verifySourceRef(doc, { ...ref, end: text.length + 5 })).toBe("unverified");
    expect(verifySourceRef(doc, { ...ref, start: -1 })).toBe("unverified");
    expect(verifySourceRef(doc, { documentId: doc.id, start: 0, end: 0, quote: "" })).toBe("unverified");
    expect(verifySourceRef(doc, { ...ref, start: 1.5 })).toBe("unverified");
    expect(verifySourceRef(doc, undefined)).toBe("unverified");
  });
});

describe("normalizeWithMap", () => {
  it("lowercases, strips diacritics, collapses punctuation/whitespace and keeps an index map", () => {
    const n = normalizeWithMap("  Hágase  LA-prueba!  ");
    expect(n.text).toBe("hagase la prueba");
    expect(n.origStart.length).toBe(n.text.length);
    expect(n.origStart[0]).toBe(2);
    expect(n.origEnd[n.text.length - 1]).toBe("  Hágase  LA-prueba".length);
  });

  it("normalizeForMatch treats curly and straight apostrophes alike", () => {
    expect(normalizeForMatch("Don’t")).toBe(normalizeForMatch("don't"));
  });
});

describe("locateQuote", () => {
  it("finds an exact quote with exact offsets and section", () => {
    const ref = locateQuote(doc, "Hágase la prueba de glucosa antes del 15 de diciembre de 2026.");
    expect(ref).not.toBeNull();
    expect(text.slice(ref!.start, ref!.end)).toBe(ref!.quote);
    expect(ref!.sectionId).toBe("follow-up-instructions");
  });

  it("falls back to a whitespace/case/punctuation-normalized match and maps back to EXACT original offsets", () => {
    const ref = locateQuote(doc, "schedule a FOLLOW UP visit in 3 months.");
    expect(ref).not.toBeNull();
    expect(ref!.quote).toBe("Schedule a follow-up   visit in 3 months.");
    expect(text.slice(ref!.start, ref!.end)).toBe(ref!.quote);
    expect(verifySourceRef(doc, ref)).toBe("verified");
  });

  it("does not re-attach punctuation the quote did not carry", () => {
    const ref = locateQuote(doc, "schedule a follow up visit in 3 months");
    expect(ref!.quote).toBe("Schedule a follow-up   visit in 3 months");
  });

  it("matches curly vs straight apostrophes and missing diacritics", () => {
    const a = locateQuote(doc, "Don't skip your morning dose.");
    expect(a!.quote).toBe("Don’t skip your morning dose.");
    const b = locateQuote(doc, "Hagase la prueba de glucosa");
    expect(b!.quote).toBe("Hágase la prueba de glucosa");
    expect(verifySourceRef(doc, a)).toBe("verified");
    expect(verifySourceRef(doc, b)).toBe("verified");
  });

  it("returns null for ambiguous quotes (exact or normalized) unless asked for the first", () => {
    expect(locateQuote(doc, "Bring your log.")).toBeNull();
    expect(locateQuote(doc, "bring your LOG")).toBeNull();
    const first = locateQuote(doc, "Bring your log.", { onAmbiguous: "first" });
    expect(first!.start).toBe(text.indexOf("Bring your log."));
  });

  it("returns null when the quote is absent, partial-word, or empty", () => {
    expect(locateQuote(doc, "Take aspirin every day.")).toBeNull();
    expect(locateQuote(doc, "chedule a follow up")).toBeNull();
    expect(locateQuote(doc, "   ")).toBeNull();
    expect(locateQuote(doc, "...")).toBeNull();
  });
});

describe("verifySourceRefs", () => {
  it("keeps exact refs, repairs offsets for real quotes, and downgrades fabricated ones", () => {
    const good = exact("Hágase la prueba de glucosa");
    const items: VerifiableItem[] = [
      { sourceRef: good, sourceVerification: "unverified" },
      { sourceRef: { ...good, start: 0, end: 5 }, sourceVerification: "verified" },
      { sourceRef: { documentId: doc.id, start: 0, end: 10, quote: "Stop all medicines." }, sourceVerification: "verified" },
      { sourceVerification: "not_applicable" },
      { sourceVerification: "verified" },
    ];
    const [a, b, c, d, e] = verifySourceRefs(doc, items);
    expect(a!.sourceVerification).toBe("verified");
    expect(b!.sourceVerification).toBe("verified");
    expect(b!.sourceRef).toEqual(expect.objectContaining({ start: good.start, end: good.end }));
    expect(c!.sourceVerification).toBe("unverified");
    expect(c!.sourceRef).toBeUndefined();
    expect(c!.unverifiedQuote).toBe("Stop all medicines.");
    expect(d!.sourceVerification).toBe("not_applicable");
    expect(e!.sourceVerification).toBe("unverified");
  });

  it("does not verify a ref that points at another document", () => {
    const ref = { ...exact("Bring your log."), documentId: "doc-other" };
    const [r] = verifySourceRefs(doc, [{ sourceRef: ref, sourceVerification: "verified" as const }]);
    expect(r!.sourceVerification).toBe("unverified");
  });
});
