/**
 * Helpers for building synthetic after-visit summary fixtures.
 *
 * Section offsets are DERIVED from the final text (never hand-typed), so they
 * always satisfy `text.slice(start, end)` === the heading line + its body.
 * All content built with these helpers is fictional demonstration data.
 */
import type {
  DocumentId,
  DocumentSection,
  PatientId,
  PatientProfile,
  SourceRef,
  VisitDocument,
} from "@/lib/types";

/** One synthetic patient fixture: profile + its pre-loaded visit document. */
export interface PatientFixture {
  profile: PatientProfile;
  document: VisitDocument;
}

export interface AvsSectionInput {
  heading: string;
  /** Body lines; joined with "\n". */
  lines: string[];
}

export interface AvsInput {
  id: DocumentId;
  patientId: PatientId;
  title: string;
  createdAt: string;
  /** Header lines printed before the first heading (patient, date, clinic…). */
  header: string[];
  sections: AvsSectionInput[];
}

/** Lowercase, accent-stripped, hyphenated slug ("Cuándo buscar atención" → "cuando-buscar-atencion"). */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Derive section boundaries from heading lines. A heading is a line whose
 * trimmed content equals one of `headings`. Each section spans from the start
 * of its heading line to the last non-whitespace character before the next
 * heading (or the end of the text).
 */
export function deriveSections(text: string, headings: string[]): DocumentSection[] {
  const wanted = new Set(headings);
  const starts: { heading: string; start: number }[] = [];
  let offset = 0;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (wanted.has(trimmed)) {
      starts.push({ heading: trimmed, start: offset + line.indexOf(trimmed) });
    }
    offset += line.length + 1;
  }
  return starts.map(({ heading, start }, i) => {
    let end = i + 1 < starts.length ? starts[i + 1].start : text.length;
    while (end > start && /\s/.test(text[end - 1])) end--;
    return { id: slugify(heading), heading, start, end };
  });
}

/** Compose the plain text of an after-visit summary from header + sections. */
export function composeAvsText(input: Pick<AvsInput, "header" | "sections">): string {
  const blocks = [input.header.join("\n")];
  for (const s of input.sections) blocks.push([s.heading, ...s.lines].join("\n"));
  return blocks.join("\n\n") + "\n";
}

/** Build a VisitDocument with programmatically derived section offsets. */
export function buildVisitDocument(input: AvsInput): VisitDocument {
  const text = composeAvsText(input);
  return {
    id: input.id,
    patientId: input.patientId,
    title: input.title,
    text,
    sections: deriveSections(
      text,
      input.sections.map((s) => s.heading),
    ),
    createdAt: input.createdAt,
    source: "fixture",
  };
}

/**
 * Exact SourceRef for a quote that must occur exactly once in the document.
 * Throws at module load if the quote is missing or ambiguous, so a broken
 * fixture can never ship silently.
 */
export function exactRef(doc: VisitDocument, quote: string): SourceRef {
  const start = doc.text.indexOf(quote);
  if (start < 0) throw new Error(`Quote not found in ${doc.id}: "${quote}"`);
  if (doc.text.indexOf(quote, start + 1) >= 0) {
    throw new Error(`Quote is not unique in ${doc.id}: "${quote}"`);
  }
  const end = start + quote.length;
  const section = doc.sections?.find((s) => s.start <= start && end <= s.end);
  return {
    documentId: doc.id,
    start,
    end,
    quote,
    ...(section ? { sectionId: section.id } : {}),
  };
}

/** Standard section headings used by the English fixtures. */
export const EN_HEADINGS = {
  reason: "Reason for visit",
  assessment: "Assessment",
  medications: "Medications",
  followUp: "Follow-up instructions",
  seekCare: "When to seek care",
} as const;

/** Standard section headings used by the Spanish fixtures. */
export const ES_HEADINGS = {
  reason: "Motivo de la visita",
  assessment: "Evaluación",
  medications: "Medicamentos",
  followUp: "Instrucciones de seguimiento",
  seekCare: "Cuándo buscar atención",
} as const;

/** Header lines shared by every fixture (clearly marks the record as fictional). */
export function fictionalHeader(lines: string[], language: "en" | "es" = "en"): string[] {
  return language === "es"
    ? ["Resumen después de la visita", "Registro ficticio de demostración — no es un paciente real.", ...lines]
    : ["After-Visit Summary", "Fictional demonstration record — not a real patient.", ...lines];
}
