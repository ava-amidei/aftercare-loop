/**
 * Instruction extraction — clinician-documented next steps with exact source refs.
 *
 * Routing (ARCHITECTURE §4): scripted mode → scripted fixture instructions, else a
 * deterministic heuristic extractor; live mode → Claude (interpretDocument
 * prompt), falling back to the heuristic on failure. EVERY instruction is then
 * post-validated against the document text (`validateInstructions`): only an
 * instruction whose quote is found in the text is "verified"; anything else is
 * "unverified" and carries no SourceRef.
 *
 * Condition-agnostic: no condition names here — only generic section headings,
 * imperative verbs and action-type keywords.
 */
import {
  generateStructured,
  getAiMode,
  buildInterpretDocumentPrompt,
  ModelDocumentInterpretationSchema,
  type AiResult,
  type ModelDocumentInterpretation,
  type ModelInstruction,
  type StructuredRequest,
} from "@/lib/ai";
import { getScriptedInterpretation } from "@/lib/ai/scripted";
import type {
  ActionType,
  DocumentInterpretation,
  DocumentSection,
  EvidenceMatch,
  ExtractedInstruction,
  PatientProfile,
  ResponseMode,
  SourceRef,
  VisitDocument,
} from "@/lib/types";
import { slugify } from "@/lib/utils/text";
import { locateQuote, sectionIdFor, verifySourceRef, verifySourceRefs } from "./source-verification";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ExtractInstructionsInput {
  profile: PatientProfile;
  document: VisitDocument;
  /** Evidence passed to the live prompt (optional; extraction does not need it). */
  evidence?: EvidenceMatch[];
}

export type GenerateStructuredFn = <T>(req: StructuredRequest<T>) => Promise<AiResult<T>>;
export type ScriptedInterpretationFn = (
  patientId: string,
  documentId: string,
) => Omit<DocumentInterpretation, "meta"> | null;

export interface ExtractInstructionsDeps {
  mode?: ResponseMode;
  generate?: GenerateStructuredFn;
  scripted?: ScriptedInterpretationFn;
}

export type ExtractionSource = "scripted" | "heuristic" | "live";

export interface ExtractionResult {
  instructions: ExtractedInstruction[];
  source: ExtractionSource;
  /** Model id when source is "live". */
  model?: string;
  /** Safe error string when live generation failed and the heuristic was used. */
  error?: string;
}

// ---------------------------------------------------------------------------
// Section detection
// ---------------------------------------------------------------------------

/** Headings whose sentences are candidate instructions (en + es, generic). */
const INSTRUCTION_HEADING =
  /\b(follow[\s-]?up|plan|instructions?|next steps?|medications?|medicines?|treatment|recommendations?|to[\s-]?do|seguimiento|instrucciones|plan|pr[oó]ximos pasos|medicamentos|medicinas|tratamiento|recomendaciones)\b/i;

/** Warning-sign sections: excluded from heuristic extraction even if they match above. */
const WARNING_HEADING =
  /\b(when to (seek|get|call)|warning signs?|seek care|emergency|cu[aá]ndo buscar|se[nñ]ales de (alerta|advertencia)|emergencia)\b/i;

const KNOWN_HEADING_WORDS =
  /\b(reason for visit|assessment|diagnos[ie]s|history|results?|plan|follow[\s-]?up|instructions?|next steps?|medications?|medicines?|allerg(y|ies)|when to seek care|warning signs?|notes?|summary|treatment|recommendations?|motivo de la visita|evaluaci[oó]n|diagn[oó]stico|resultados|seguimiento|instrucciones|medicamentos|cu[aá]ndo buscar atenci[oó]n|pr[oó]ximos pasos|tratamiento)\b/i;

/**
 * Best-effort section detection for documents without declared sections (e.g.
 * pasted text). A heading is a short line that ends with ":" or has no
 * terminal punctuation and contains a typical after-visit-summary heading word.
 * Sections span from the heading line to the last non-space char before the next.
 */
export function detectSections(text: string): DocumentSection[] {
  const starts: { heading: string; start: number }[] = [];
  let offset = 0;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    const bare = trimmed.replace(/:$/, "").trim();
    const isHeading =
      bare.length > 0 &&
      bare.length <= 60 &&
      !/^[-*•\d]/.test(bare) &&
      !/[.!?;,]$/.test(bare) &&
      (trimmed.endsWith(":") || KNOWN_HEADING_WORDS.test(bare)) &&
      bare.split(/\s+/).length <= 7;
    if (isHeading) starts.push({ heading: bare, start: offset + line.indexOf(trimmed) });
    offset += line.length + 1;
  }
  const used = new Map<string, number>();
  return starts.map(({ heading, start }, i) => {
    let end = i + 1 < starts.length ? starts[i + 1]!.start : text.length;
    while (end > start && /\s/.test(text[end - 1]!)) end--;
    const base = slugify(heading) || "section";
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    return { id: n === 1 ? base : `${base}-${n}`, heading, start, end };
  });
}

// ---------------------------------------------------------------------------
// Sentence splitting (offsets preserved)
// ---------------------------------------------------------------------------

export interface Span {
  start: number;
  end: number;
}

const ABBREVIATIONS = new Set([
  "dr", "dra", "mr", "mrs", "ms", "sr", "sra", "srta", "st", "vs", "etc", "e.g", "i.e", "approx", "no", "nº", "min", "max", "ud", "uds", "fig", "dept",
]);

/** Split [start,end) of `text` into sentence spans: by line, then by sentence-final punctuation. */
export function splitSentences(text: string, start = 0, end = text.length): Span[] {
  const spans: Span[] = [];
  let lineStart = start;
  for (let i = start; i <= end; i++) {
    if (i === end || text[i] === "\n") {
      splitLine(text, lineStart, i, spans);
      lineStart = i + 1;
    }
  }
  return spans;
}

function splitLine(text: string, start: number, end: number, out: Span[]): void {
  let sStart = start;
  for (let i = start; i < end; i++) {
    const ch = text[i]!;
    if (ch !== "." && ch !== "!" && ch !== "?") continue;
    const next = text[i + 1];
    if (i + 1 < end && next !== " " && next !== "\t") continue; // "2.5", "e.g."
    if (/^\s*(?:[-*•–]\s*)?\d{1,2}$/.test(text.slice(sStart, i))) continue; // list number "1."
    // Abbreviation before the period ("Dr.").
    if (ch === ".") {
      const wordMatch = /([\p{L}.]+)$/u.exec(text.slice(sStart, i));
      if (wordMatch && ABBREVIATIONS.has(wordMatch[1]!.toLowerCase())) continue;
    }
    // Next non-space char should start a new sentence (upper-case, digit, bullet, opening mark).
    let j = i + 1;
    while (j < end && (text[j] === " " || text[j] === "\t")) j++;
    if (j < end && !/[\p{Lu}\d¿¡"“(\-•*]/u.test(text[j]!)) continue;
    pushTrimmed(text, sStart, i + 1, out);
    sStart = i + 1;
  }
  pushTrimmed(text, sStart, end, out);
}

/** Trim whitespace and leading bullet markers ("- ", "• ", "1. ", "2) "). */
function pushTrimmed(text: string, start: number, end: number, out: Span[]): void {
  let s = start;
  let e = end;
  while (s < e && /\s/.test(text[s]!)) s++;
  const marker = /^(?:[-*•–]\s+|\d{1,2}[.)]\s+|\[\s?\]\s+)/.exec(text.slice(s, e));
  if (marker) s += marker[0].length;
  while (s < e && /\s/.test(text[s]!)) s++;
  while (e > s && /\s/.test(text[e - 1]!)) e--;
  if (e > s) out.push({ start: s, end: e });
}

// ---------------------------------------------------------------------------
// Heuristic classification
// ---------------------------------------------------------------------------

/** Imperative verbs that open a documented instruction (en + es, accent-free, lowercase). */
const IMPERATIVE_VERBS = new Set([
  // English (assignment list first)
  "schedule", "take", "start", "continue", "return", "call", "check", "monitor", "bring", "avoid", "stop",
  // English (common after-visit-summary verbs)
  "get", "keep", "track", "use", "limit", "drink", "add", "wear", "weigh", "fill", "follow", "book",
  "make", "record", "write", "attend", "complete", "measure", "repeat", "contact", "apply", "increase",
  "reduce", "see", "go", "eat", "ask", "log", "do", "don't", "dont", "never", "begin", "finish",
  // Spanish (formal imperative)
  "tome", "siga", "continue", "hagase", "haga", "llegue", "pida", "anote", "llame", "regrese", "vuelva",
  "programe", "agende", "use", "evite", "deje", "revise", "traiga", "mida", "beba", "coma", "limite",
  "acuda", "pese", "registre", "lleve", "aplique", "complete", "empiece", "comience", "suspenda", "no",
]);

function foldWord(word: string): string {
  return word
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z']/g, "");
}

/** True when a sentence reads as an imperative instruction. */
export function isImperative(sentence: string): boolean {
  const words = sentence
    .replace(/^(please|por favor)[,\s]+/i, "")
    .split(/\s+/)
    .map(foldWord)
    .filter(Boolean);
  const first = words[0];
  if (!first || !IMPERATIVE_VERBS.has(first)) return false;
  // "Do"/"No" alone are only imperative as a negation: "Do not take…", "No tome…".
  if (first === "do") return words[1] === "not";
  if (first === "no") return words[1] !== undefined && IMPERATIVE_VERBS.has(words[1]) && words[1] !== "no";
  return true;
}

const TYPE_RULES: Array<[ActionType, RegExp]> = [
  ["referral", /\b(referral|refer(red)?|consultation|specialist|remisi[oó]n|referid[oa]|especialista|interconsulta)\b/i],
  [
    "test_or_lab",
    /\b(blood (test|work)|lab(s|oratory)?|test(s)?|ultrasound|mammogram|x-?ray|scan|mri|ct|panel|a1c|tsh|screening|exam|imaging|biopsy|prueba|an[aá]lisis|laboratorio|hemograma|ecograf[ií]a|ultrasonido|mamograf[ií]a|examen)\b/i,
  ],
  [
    "medication",
    /\b(\d+(\.\d+)?\s?(mg|mcg|g|ml|units?)|tablets?|pills?|capsules?|inhaler|puffs?|doses?|medicines?|medications?|vitamins?|supplements?|prescriptions?|pain relievers?|tabletas?|pastillas?|c[aá]psulas?|inhalador|dosis|medicamento|medicina|vitamina|suplementos?|hierro)\b/i,
  ],
  [
    "appointment",
    /\b(appointment|visit|follow[\s-]?up|return (to|in)|check-?up|cita|visita|consulta|control|regrese|vuelva)\b/i,
  ],
  [
    "monitoring",
    /\b(track|record|diary|log|write (it )?down|weigh|weight|monitor|measure|peak flow|blood pressure|reading|anote|registre|diario|p[eé]sese|mida|presi[oó]n arterial)\b/i,
  ],
  [
    "lifestyle",
    /\b(drink|fluids?|water|salt|diet|exercise|sleep|wear|stockings|food|meals?|walk|beba|l[ií]quidos|agua|sal|dieta|ejercicio|dormir|comida)\b/i,
  ],
];

/**
 * Generic keyword-based action type (condition-agnostic). "Take/Use … <dose or
 * medicine word>" is a medication; otherwise the type whose keyword appears
 * EARLIEST in the sentence wins ("Schedule a follow-up … to review your labs" →
 * appointment; "Get blood work … before your next visit" → test_or_lab).
 */
export function classifyInstruction(sentence: string): ActionType {
  // "next visit" / "próxima cita" are time anchors, not appointments.
  const text = sentence.replace(
    /\b(next|upcoming|pr[oó]xim[ao]|siguiente)\s+(visit|appointment|cita|visita|consulta)\b/gi,
    (m) => " ".repeat(m.length),
  );
  const first = foldWord(text.trim().split(/\s+/)[0] ?? "");
  const med = TYPE_RULES.find(([t]) => t === "medication")![1];
  if (["take", "use", "tome", "siga", "keep", "continue", "limit", "stop", "start"].includes(first) && med.test(text)) {
    return "medication";
  }
  if (["return", "regrese", "vuelva"].includes(first)) return "appointment";
  let best: { type: ActionType; index: number } | null = null;
  for (const [type, re] of TYPE_RULES) {
    const m = re.exec(text);
    if (m && (best === null || m.index < best.index)) best = { type, index: m.index };
  }
  return best ? best.type : "other";
}

// ---------------------------------------------------------------------------
// Due dates (explicit only)
// ---------------------------------------------------------------------------

const MONTHS: Record<string, number> = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2, april: 3, apr: 3, may: 4, june: 5, jun: 5,
  july: 6, jul: 6, august: 7, aug: 7, september: 8, sep: 8, sept: 8, october: 9, oct: 9, november: 10,
  nov: 10, december: 11, dec: 11,
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8,
  setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7,
  ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12,
};

type Unit = "day" | "week" | "month" | "year";

const UNIT_MAP: Record<string, Unit> = {
  day: "day", days: "day", week: "week", weeks: "week", month: "month", months: "month", year: "year",
  years: "year", dia: "day", dias: "day", semana: "week", semanas: "week", mes: "month", meses: "month",
  ano: "year", anos: "year",
};

function parseBase(createdAt: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(createdAt ?? "");
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(d.getTime()) ? null : d;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function validYmd(y: number, mo: number, day: number): Date | null {
  const d = new Date(Date.UTC(y, mo, day));
  if (d.getUTCFullYear() !== y || d.getUTCMonth() !== mo || d.getUTCDate() !== day) return null;
  return d;
}

function addUnits(base: Date, n: number, unit: Unit): Date {
  const d = new Date(base.getTime());
  if (unit === "day") d.setUTCDate(d.getUTCDate() + n);
  else if (unit === "week") d.setUTCDate(d.getUTCDate() + n * 7);
  else {
    const months = unit === "month" ? n : n * 12;
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + months);
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last));
  }
  return d;
}

/** Month/day without a year → the first such date on or after the document date. */
function withInferredYear(base: Date, mo: number, day: number): Date | null {
  const y = base.getUTCFullYear();
  const same = validYmd(y, mo, day);
  if (same && same.getTime() >= base.getTime()) return same;
  return validYmd(y + 1, mo, day);
}

function toNumber(token: string): number | null {
  if (/^\d{1,3}$/.test(token)) return Number(token);
  return NUMBER_WORDS[token] ?? null;
}

/**
 * Due date ("YYYY-MM-DD") ONLY when the quote states an explicit date or an
 * explicit time window ("in 6 weeks", "within the next 2 weeks", "by October
 * 30, 2026", "antes del 15 de diciembre de 2026", "en 8 semanas"). Relative
 * windows count from the document date. Ranges use the later bound. Returns
 * undefined otherwise — never guesses (no "this year", "before your next visit").
 */
export function parseDueDate(quote: string, createdAt: string): string | undefined {
  const base = parseBase(createdAt);
  if (!base || typeof quote !== "string") return undefined;
  const text = quote
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[’]/g, "'");

  // ISO date.
  const isoM = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(text);
  if (isoM) {
    const d = validYmd(Number(isoM[1]), Number(isoM[2]) - 1, Number(isoM[3]));
    if (d) return iso(d);
  }
  // US numeric date M/D/YYYY.
  const us = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/.exec(text);
  if (us) {
    const d = validYmd(Number(us[3]), Number(us[1]) - 1, Number(us[2]));
    if (d) return iso(d);
  }
  // "October 30, 2026" / "Oct 30" / "November 18th".
  const monthNames = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join("|");
  const mdy = new RegExp(`\\b(${monthNames})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?:,?\\s+(\\d{4}))?`).exec(text);
  if (mdy && MONTHS[mdy[1]!] !== undefined) {
    const mo = MONTHS[mdy[1]!]!;
    const day = Number(mdy[2]);
    const d = mdy[3] ? validYmd(Number(mdy[3]), mo, day) : withInferredYear(base, mo, day);
    if (d) return iso(d);
  }
  // "15 de diciembre de 2026" / "30 October 2026".
  const dmy = new RegExp(`\\b(\\d{1,2})\\s+(?:de\\s+)?(${monthNames})\\b(?:,?\\s+(?:de(?:l)?\\s+)?(\\d{4}))?`).exec(text);
  if (dmy && MONTHS[dmy[2]!] !== undefined) {
    const mo = MONTHS[dmy[2]!]!;
    const day = Number(dmy[1]);
    const d = dmy[3] ? validYmd(Number(dmy[3]), mo, day) : withInferredYear(base, mo, day);
    if (d) return iso(d);
  }

  // Relative window: "in|within (the next) N[-M| to M] unit(s)", "en|dentro de N unidades".
  const num = "(\\d{1,3}|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)";
  const units = "(days?|weeks?|months?|years?|dias?|semanas?|mes(?:es)?|anos?)";
  const rel = new RegExp(
    `\\b(?:in|within|en|dentro\\s+de)\\s+(?:the\\s+next\\s+|the\\s+coming\\s+|los\\s+proximos\\s+|las\\s+proximas\\s+|el\\s+proximo\\s+|la\\s+proxima\\s+|about\\s+|unas?\\s+)?${num}(?:\\s*(?:-|–|to|or|a|o)\\s*${num})?\\s+${units}\\b`,
    "g",
  );
  for (const m of text.matchAll(rel)) {
    const before = text.slice(0, m.index);
    // A window inside a condition ("…if your weight goes up 2 pounds in one day")
    // or a limit ("no more than 2 tablets in 1 day") is not a deadline.
    if (/\b(if|unless|when|whenever|si|cuando|a menos que)\b/.test(before)) continue;
    if (/\b(more|less|fewer|than|up to|at most|mas|menos|hasta)\b[^,.;]{0,40}$/.test(before)) continue;
    const lo = toNumber(m[1]!);
    const hi = m[2] ? toNumber(m[2]) : null;
    const unit = UNIT_MAP[m[3]!];
    const n = Math.max(lo ?? 0, hi ?? 0);
    if (unit && n > 0 && n <= 120) return iso(addUnits(base, n, unit));
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Heuristic extractor
// ---------------------------------------------------------------------------

function sectionsOf(doc: VisitDocument): DocumentSection[] {
  return doc.sections && doc.sections.length > 0 ? doc.sections : detectSections(doc.text ?? "");
}

/**
 * Deterministic extractor: imperative sentences inside follow-up / plan /
 * instructions / next-steps / medications sections. The sentence itself is the
 * quote (exact offsets) and the description (no paraphrase, so nothing is invented).
 * With no recognizable section, the whole document (minus warning-sign sections) is scanned.
 */
export function extractInstructionsHeuristic(doc: VisitDocument): ExtractedInstruction[] {
  const text = doc.text ?? "";
  const all = sectionsOf(doc);
  const located = { ...doc, sections: all };
  const selected = all.filter((s) => INSTRUCTION_HEADING.test(s.heading) && !WARNING_HEADING.test(s.heading));
  let ranges: Span[];
  if (selected.length > 0) {
    ranges = selected.map((s) => {
      // Skip the heading line itself.
      const nl = text.indexOf("\n", s.start);
      const bodyStart = nl >= 0 && nl < s.end ? nl + 1 : s.end;
      return { start: bodyStart, end: s.end };
    });
  } else {
    const warnings = all.filter((s) => WARNING_HEADING.test(s.heading));
    ranges = [{ start: 0, end: text.length }];
    for (const w of warnings) {
      ranges = ranges.flatMap((r) =>
        w.end <= r.start || w.start >= r.end
          ? [r]
          : [
              { start: r.start, end: Math.max(r.start, w.start) },
              { start: Math.min(r.end, w.end), end: r.end },
            ].filter((x) => x.end > x.start),
      );
    }
  }

  const out: ExtractedInstruction[] = [];
  for (const range of ranges) {
    for (const span of splitSentences(text, range.start, range.end)) {
      const quote = text.slice(span.start, span.end);
      if (quote.length < 8 || !isImperative(quote)) continue;
      const sectionId = sectionIdFor(located, span.start, span.end);
      const ref: SourceRef = {
        documentId: doc.id,
        start: span.start,
        end: span.end,
        quote,
        ...(sectionId ? { sectionId } : {}),
      };
      out.push({
        description: quote.replace(/[.;:]+$/, ""),
        type: classifyInstruction(quote),
        sourceRef: ref,
        sourceVerification: "verified",
      });
    }
  }
  return validateInstructions(doc, out);
}

// ---------------------------------------------------------------------------
// Post-validation (applies to every source)
// ---------------------------------------------------------------------------

/**
 * Re-verify every instruction against the document text. Verified only when the
 * final ref slices exactly to its quote; otherwise "unverified" with no ref.
 * Due dates are re-derived from the verified quote (never trusted from the
 * extractor); unverified instructions never carry a due date. Duplicate
 * locations are dropped.
 */
export function validateInstructions(
  doc: VisitDocument,
  items: readonly ExtractedInstruction[],
): ExtractedInstruction[] {
  const checked = verifySourceRefs(
    doc,
    items.map((item) => ({ ...item, sourceVerification: "unverified" as const })),
  );
  const seen = new Set<string>();
  const out: ExtractedInstruction[] = [];
  for (const item of checked) {
    const { dueDate: _claimed, ...rest } = item;
    void _claimed;
    if (item.sourceRef && verifySourceRef(doc, item.sourceRef) === "verified") {
      const key = `${item.sourceRef.start}:${item.sourceRef.end}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const dueDate = parseDueDate(item.sourceRef.quote, doc.createdAt);
      out.push({ ...rest, sourceVerification: "verified", ...(dueDate ? { dueDate } : {}) });
    } else {
      const { sourceRef: _bad, ...noRef } = rest;
      void _bad;
      out.push({ ...noRef, sourceVerification: "unverified" });
    }
  }
  return out;
}

/** Map model instructions (verbatim quotes, no offsets) into validated instructions. */
export function fromModelInstructions(
  doc: VisitDocument,
  items: readonly ModelInstruction[],
): ExtractedInstruction[] {
  const mapped: ExtractedInstruction[] = items.map((m) => {
    const located = locateQuote(doc, m.sourceQuote ?? "");
    const base: ExtractedInstruction = {
      description: m.description,
      type: m.type,
      sourceVerification: located ? "verified" : "unverified",
    };
    if (located) return { ...base, sourceRef: located };
    const claimed = (m.sourceQuote ?? "").trim();
    return claimed ? { ...base, unverifiedQuote: claimed } : base;
  });
  return validateInstructions(doc, mapped);
}

// ---------------------------------------------------------------------------
// extractInstructions (routed)
// ---------------------------------------------------------------------------

/** Run the live interpretation call (shared with document-interpreter). */
export async function generateModelInterpretation(
  input: ExtractInstructionsInput,
  generate: GenerateStructuredFn = generateStructured,
): Promise<AiResult<ModelDocumentInterpretation>> {
  const prompt = buildInterpretDocumentPrompt({
    profile: input.profile,
    document: input.document,
    evidence: input.evidence ?? [],
  });
  return generate({
    ...prompt,
    schema: ModelDocumentInterpretationSchema,
    effort: "high",
    label: "interpret",
  });
}

/** Full extraction with provenance (which path produced the instructions). */
export async function extractInstructionsDetailed(
  input: ExtractInstructionsInput,
  deps: ExtractInstructionsDeps = {},
): Promise<ExtractionResult> {
  const { profile, document } = input;
  const mode = deps.mode ?? getAiMode();

  if (mode === "scripted_demo") {
    const scripted = (deps.scripted ?? getScriptedInterpretation)(profile.id, document.id);
    if (scripted && Array.isArray(scripted.instructions)) {
      return { instructions: validateInstructions(document, scripted.instructions), source: "scripted" };
    }
    return { instructions: extractInstructionsHeuristic(document), source: "heuristic" };
  }

  const result = await generateModelInterpretation(input, deps.generate ?? generateStructured);
  if (result.ok) {
    return {
      instructions: fromModelInstructions(document, result.data.instructions),
      source: "live",
      model: result.model,
    };
  }
  return { instructions: extractInstructionsHeuristic(document), source: "heuristic", error: result.error };
}

/** Clinician-documented instructions for a document, each post-validated against its text. */
export async function extractInstructions(
  input: ExtractInstructionsInput,
  deps: ExtractInstructionsDeps = {},
): Promise<ExtractedInstruction[]> {
  return (await extractInstructionsDetailed(input, deps)).instructions;
}
