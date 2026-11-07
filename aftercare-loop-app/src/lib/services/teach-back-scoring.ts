/**
 * Deterministic teach-back scoring (pure, no AI, safe to import from client code).
 *
 * Correctness is decided ONLY here, from the predefined answer key on the
 * question record (expectedAnswer, acceptedVariations, keyConcepts, choices,
 * scoring). The model is never asked whether an answer is correct.
 *
 * Condition-agnostic: no condition names or patient ids appear in this file; the
 * small synonym table below covers everyday frequency/time phrasing only.
 */
import type { TeachBackQuestion, TeachBackScore } from "@/lib/types";

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Number words → digits so "eight hours" and "8 hours" compare equal.
 * Spanish "once" (11) is deliberately omitted: it collides with English "once".
 */
const NUMBER_WORDS: Record<string, string> = {
  zero: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  eleven: "11",
  twelve: "12",
  fourteen: "14",
  thirty: "30",
  cero: "0",
  uno: "1",
  una: "1",
  dos: "2",
  tres: "3",
  cuatro: "4",
  cinco: "5",
  seis: "6",
  siete: "7",
  ocho: "8",
  nueve: "9",
  diez: "10",
  doce: "12",
  catorce: "14",
  treinta: "30",
};

/** Lowercase, strip accents and punctuation, collapse whitespace, digits for number words. */
export function normalizeAnswer(text: string): string {
  return tokenize(text).join(" ");
}

export function tokenize(text: string): string[] {
  if (typeof text !== "string") return [];
  const base = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    // Drop apostrophes inside words: "don't" → "dont".
    .replace(/['‘’ʼ`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!base) return [];
  return base.split(" ").map((t) => NUMBER_WORDS[t] ?? t);
}

// ---------------------------------------------------------------------------
// Phrase matching
// ---------------------------------------------------------------------------

/** Max extra characters a response token may have beyond a concept token ("lab" → "labs"). */
const MAX_SUFFIX = 3;

function tokenMatches(responseToken: string, conceptToken: string): boolean {
  if (responseToken === conceptToken) return true;
  // Numbers and very short tokens must match exactly.
  if (/^\d+$/.test(conceptToken) || conceptToken.length < 3) return false;
  return (
    responseToken.startsWith(conceptToken) &&
    responseToken.length - conceptToken.length <= MAX_SUFFIX
  );
}

/** True when `phraseTokens` appears as a contiguous run in `responseTokens`. */
export function containsPhrase(responseTokens: string[], phraseTokens: string[]): boolean {
  if (phraseTokens.length === 0 || phraseTokens.length > responseTokens.length) return false;
  outer: for (let i = 0; i + phraseTokens.length <= responseTokens.length; i++) {
    for (let j = 0; j < phraseTokens.length; j++) {
      if (!tokenMatches(responseTokens[i + j]!, phraseTokens[j]!)) continue outer;
    }
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Key concepts + synonyms
// ---------------------------------------------------------------------------

/**
 * Everyday phrasing equivalents (frequency/time words only — never clinical).
 * Each inner list is one group of interchangeable phrases.
 */
const GENERIC_SYNONYM_GROUPS: string[][] = [
  ["twice", "2 times", "2x", "dos veces"],
  ["with food", "with meals", "with a meal", "with my meals", "con comida", "con las comidas"],
  ["daily", "every day", "each day", "per day", "a day", "cada dia", "todos los dias", "al dia", "diario", "diaria"],
  ["every year", "each year", "yearly", "annual", "annually", "once a year", "1 time a year", "cada ano", "una vez al ano", "anual", "anualmente", "todos los anos"],
  ["every week", "each week", "weekly", "once a week", "cada semana", "semanal", "semanalmente"],
];

export interface ConceptGroup {
  /** Canonical label (first listed form) reported in matchedConcepts. */
  label: string;
  /** Tokenized alternatives, any of which counts as this concept. */
  alternatives: string[][];
}

function splitConcept(raw: string): string[] {
  return raw
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Build distinct concept groups. Supports "concept|synonym|synonym" syntax in
 * keyConcepts, the optional `conceptSynonyms` map, and the generic table above.
 * Concepts that share any alternative (e.g. "8 hours" / "eight hours") are
 * merged so one idea is never counted twice.
 */
export function buildConceptGroups(question: TeachBackQuestion): ConceptGroup[] {
  const synonymsMap = question.conceptSynonyms ?? {};
  const pending: { label: string; forms: Set<string> }[] = [];

  for (const raw of question.keyConcepts) {
    const parts = splitConcept(raw);
    if (parts.length === 0) continue;
    const label = parts[0]!;
    const forms = new Set<string>();
    const add = (s: string) => {
      const n = normalizeAnswer(s);
      if (n) forms.add(n);
    };
    parts.forEach(add);
    (synonymsMap[raw] ?? []).forEach(add);
    if (raw !== label) (synonymsMap[label] ?? []).forEach(add);
    for (const group of GENERIC_SYNONYM_GROUPS) {
      const normalizedGroup = group.map(normalizeAnswer);
      if (normalizedGroup.some((g) => forms.has(g))) normalizedGroup.forEach((g) => forms.add(g));
    }
    if (forms.size > 0) pending.push({ label, forms });
  }

  // Merge groups with overlapping forms (small n; simple repeated pass).
  const merged: { label: string; forms: Set<string> }[] = [];
  for (const item of pending) {
    const overlapping = merged.filter((m) => [...item.forms].some((f) => m.forms.has(f)));
    if (overlapping.length === 0) {
      merged.push({ label: item.label, forms: new Set(item.forms) });
      continue;
    }
    const target = overlapping[0]!;
    item.forms.forEach((f) => target.forms.add(f));
    for (const other of overlapping.slice(1)) {
      other.forms.forEach((f) => target.forms.add(f));
      merged.splice(merged.indexOf(other), 1);
    }
  }

  return merged.map((m) => ({
    label: m.label,
    alternatives: [...m.forms].map((f) => f.split(" ")),
  }));
}

export function matchConcepts(groups: ConceptGroup[], responseTokens: string[]): string[] {
  return groups
    .filter((g) => g.alternatives.some((alt) => containsPhrase(responseTokens, alt)))
    .map((g) => g.label);
}

// ---------------------------------------------------------------------------
// Accepted variations (fuzzy)
// ---------------------------------------------------------------------------

/** Function words ignored when measuring token overlap (en + es). */
const STOPWORDS = new Set(
  (
    "a an the and or of to in on at for with by from is are be am i my me it its this that " +
    "so do should would will can you your we our about before after then than as just only " +
    "el la los las un unos unas y o de del al en con por para es son ser mi mis me su sus lo " +
    "que se le les yo tu usted muy mas"
  ).split(" "),
);

export const VARIATION_OVERLAP_THRESHOLD = 0.6;

function contentTokens(tokens: string[]): string[] {
  return tokens.filter((t) => !STOPWORDS.has(t));
}

/**
 * Share of the variation's content tokens present in the response
 * (same suffix-tolerant token rule as concepts). 0 when the variation has none.
 */
export function variationOverlap(responseTokens: string[], variationTokens: string[]): number {
  const wanted = Array.from(new Set(contentTokens(variationTokens)));
  if (wanted.length === 0) return 0;
  const hits = wanted.filter((w) => responseTokens.some((r) => tokenMatches(r, w))).length;
  return hits / wanted.length;
}

type VariationMatch = "exact" | "includes" | "overlap" | null;

function matchVariation(responseTokens: string[], variation: string): VariationMatch {
  const v = tokenize(variation);
  if (v.length === 0 || responseTokens.length === 0) return null;
  if (v.join(" ") === responseTokens.join(" ")) return "exact";
  if (contentTokens(v).length > 0 && containsPhrase(responseTokens, v)) return "includes";
  // Overlap needs at least two content tokens to avoid single-word coincidences.
  if (
    contentTokens(v).length >= 2 &&
    variationOverlap(responseTokens, v) >= VARIATION_OVERLAP_THRESHOLD
  ) {
    return "overlap";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Misconceptions
// ---------------------------------------------------------------------------

export function detectMisconception(
  question: TeachBackQuestion,
  response: string,
): string | undefined {
  const tokens = tokenize(response);
  for (const m of question.scoring.misconceptions ?? []) {
    const pattern = tokenize(m.pattern);
    if (pattern.length > 0 && containsPhrase(tokens, pattern)) return m.clarification;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// scoreTeachBack
// ---------------------------------------------------------------------------

function findChoice(question: TeachBackQuestion, response: string) {
  const choices = question.choices ?? [];
  if (choices.length === 0) return undefined;
  const trimmed = response.trim().toLowerCase().replace(/[.)\s]+$/, "");
  const byId = choices.find((c) => c.id.toLowerCase() === trimmed);
  if (byId) return byId;
  const normalized = normalizeAnswer(response);
  return normalized ? choices.find((c) => normalizeAnswer(c.text) === normalized) : undefined;
}

/**
 * Score a patient's answer against the question's predefined answer key.
 *
 * - A response equal to a choice id (e.g. "b") or a choice's exact text uses
 *   that choice's `correct` flag.
 * - Otherwise free text: correct iff at least `minKeyConceptsForCorrect`
 *   distinct key concepts are present, or an accepted variation (or the
 *   expected answer) matches — exactly, as a contained phrase, or by content
 *   token overlap ≥ 0.6. Overlap matching is skipped when a misconception
 *   pattern is present.
 * - `misunderstanding` is the matching misconception's clarification, only
 *   when the answer is not correct.
 */
export function scoreTeachBack(question: TeachBackQuestion, response: string): TeachBackScore {
  const text = typeof response === "string" ? response : "";
  const tokens = tokenize(text);
  const groups = buildConceptGroups(question);
  const misconception = detectMisconception(question, text);

  const choice = findChoice(question, text);
  if (choice) {
    const matchedConcepts = matchConcepts(groups, tokenize(choice.text));
    const misunderstanding = choice.correct
      ? undefined
      : detectMisconception(question, choice.text) ?? misconception;
    return {
      correct: choice.correct,
      matchedConcepts,
      matchedBy: "choice",
      choiceId: choice.id,
      ...(misunderstanding ? { misunderstanding } : {}),
    };
  }

  if (tokens.length === 0) {
    return { correct: false, matchedConcepts: [], matchedBy: "none" };
  }

  const matchedConcepts = matchConcepts(groups, tokens);
  const min = Math.max(
    1,
    Math.min(question.scoring.minKeyConceptsForCorrect, Math.max(groups.length, 1)),
  );
  const byConcepts = groups.length > 0 && matchedConcepts.length >= min;

  const variations = [question.expectedAnswer, ...question.acceptedVariations];
  const byVariation = variations.some((v) => {
    const m = matchVariation(tokens, v);
    return m === "exact" || m === "includes" || (m === "overlap" && !misconception);
  });

  if (byVariation || byConcepts) {
    return {
      correct: true,
      matchedConcepts,
      matchedBy: byConcepts ? "key_concepts" : "accepted_variation",
    };
  }
  return {
    correct: false,
    matchedConcepts,
    matchedBy: "none",
    ...(misconception ? { misunderstanding: misconception } : {}),
  };
}
