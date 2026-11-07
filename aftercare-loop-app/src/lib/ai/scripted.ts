/**
 * Scripted Demo Mode: deterministic, clearly-labeled responses for the fictional
 * demo patients (ARCHITECTURE §2.9). Used when no ANTHROPIC_API_KEY is set.
 *
 * Content lives in src/data/scripted (one file per patient). This module only
 * routes lookups: interpretation by patient + document, Ask Kat replies by quick
 * prompt → exact question slug → keyword sets, and teach-back clarifications by
 * question id + attempt. Anything not covered returns null so callers can show
 * SCRIPTED_UNSUPPORTED instead of inventing an answer.
 */
import type {
  DocumentId,
  DocumentInterpretation,
  PatientId,
  QuestionId,
  QuickPromptId,
} from "@/lib/types";
import { getDocument } from "@/data/patients";
import { getGroundTruth } from "@/data/ground-truth";
import {
  buildScriptedInterpretation,
  getScriptedClarifications,
  getScriptedContent,
  type ScriptedFreeTextEntry,
} from "@/data/scripted";
import { askKat as enAskKat } from "@/lib/i18n/en/askKat";
import { askKat as esAskKat } from "@/lib/i18n/es/askKat";

/**
 * Public reply shape (kept loose — `kind: string` — for compatibility with
 * callers that validate kinds themselves). The content in src/data/scripted is
 * typed strictly with KatActionKind and is assignable to this.
 */
export interface ScriptedKatReply {
  content: string;
  referenceIds?: string[];
  /** Quotes (exact substrings of the active document) to turn into SourceRefs. */
  sourceQuotes?: string[];
  actions?: { kind: string; label: string; payload?: Record<string, unknown> }[];
}

/**
 * Normalize free text to a lookup slug: lowercase, strip accents and
 * punctuation, collapse spaces. ("What's my follow-up?" → "whats my followup")
 */
export function slugifyQuestion(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Document interpretation
// ---------------------------------------------------------------------------

export function getScriptedInterpretation(
  patientId: PatientId,
  documentId: DocumentId,
): Omit<DocumentInterpretation, "meta"> | null {
  const content = getScriptedContent(patientId);
  if (!content || content.documentId !== documentId) return null;
  const doc = getDocument(documentId);
  if (!doc || doc.patientId !== patientId) return null;
  return buildScriptedInterpretation(content, doc, getGroundTruth(patientId));
}

// ---------------------------------------------------------------------------
// Ask Kat
// ---------------------------------------------------------------------------

const QUICK_PROMPT_IDS: QuickPromptId[] = [
  "what_should_i_ask",
  "explain_my_diagnosis",
  "understand_my_results",
  "plan_next_steps",
  "free_text",
];

/** Chip labels (en + es) → QuickPromptId, so typed chip text behaves like the chip. */
const QUICK_PROMPT_BY_SLUG: ReadonlyMap<string, QuickPromptId> = new Map(
  QUICK_PROMPT_IDS.flatMap((id) => {
    const key = `askKat.chip.${id}` as keyof typeof enAskKat;
    const labels = [enAskKat[key], (esAskKat as Record<string, string>)[key]].filter(
      (l): l is string => typeof l === "string",
    );
    return labels.map((l) => [slugifyQuestion(l), id] as const);
  }),
);

function keywordMatches(tokens: string[], slug: string, keyword: string): boolean {
  const kw = slugifyQuestion(keyword);
  if (!kw) return false;
  if (kw.includes(" ")) return ` ${slug} `.includes(` ${kw}`);
  return tokens.some((t) => t.startsWith(kw));
}

/**
 * Best free-text entry for a slug: exact canonical question first, then the
 * keyword set with the most matched keywords (ties → earlier entry).
 */
export function matchScriptedFreeText(
  entries: ScriptedFreeTextEntry[],
  slug: string,
): ScriptedFreeTextEntry | null {
  if (!slug) return null;
  const exact = entries.find((e) => e.questions.some((q) => slugifyQuestion(q) === slug));
  if (exact) return exact;
  const tokens = slug.split(" ");
  let best: ScriptedFreeTextEntry | null = null;
  let bestScore = 0;
  for (const entry of entries) {
    for (const set of entry.keywords) {
      if (set.length > bestScore && set.every((kw) => keywordMatches(tokens, slug, kw))) {
        best = entry;
        bestScore = set.length;
      }
    }
  }
  return best;
}

export function getScriptedKatReply(
  patientId: PatientId,
  messageOrPrompt: string,
  quickPrompt?: QuickPromptId,
): ScriptedKatReply | null {
  const content = getScriptedContent(patientId);
  if (!content) return null;
  if (quickPrompt && quickPrompt !== "free_text") return content.quickPrompts[quickPrompt] ?? null;

  const slug = slugifyQuestion(messageOrPrompt ?? "");
  if (!slug) return quickPrompt === "free_text" ? content.quickPrompts.free_text : null;

  const chip = QUICK_PROMPT_BY_SLUG.get(slug);
  if (chip) return content.quickPrompts[chip] ?? null;

  return matchScriptedFreeText(content.freeText, slug)?.reply ?? null;
}

/** Canonical example questions Kat can answer in scripted mode for a patient (for UI hints). */
export function getScriptedSuggestedQuestions(patientId: PatientId): string[] {
  return getScriptedContent(patientId)?.freeText.map((e) => e.questions[0]) ?? [];
}

// ---------------------------------------------------------------------------
// Teach-back
// ---------------------------------------------------------------------------

/** Re-explanation for an incorrect attempt: attempt 1 → first version, 2+ → a different second version. */
export function getScriptedClarification(questionId: QuestionId, attemptNumber: number): string | null {
  const pair = getScriptedClarifications(questionId);
  if (!pair) return null;
  return attemptNumber >= 2 ? pair[1] : pair[0];
}

export const SCRIPTED_MODE_LABEL =
  "Scripted Demo Mode — Responses are predefined for demonstration purposes.";
export const SCRIPTED_UNSUPPORTED =
  "This scripted demonstration can't answer that question. Add an ANTHROPIC_API_KEY to enable live responses.";
