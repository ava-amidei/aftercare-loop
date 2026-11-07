/**
 * Teach-back service (Check My Understanding). Server-side.
 *
 * - Correctness: ONLY `scoreTeachBack` (deterministic, answer key from the
 *   question record). The model never decides or invents the expected answer.
 * - Re-explanation: scripted lookup or a deterministic template in Scripted Demo
 *   Mode; Claude (structured output) in live mode, with deterministic fallback.
 * - Language is always non-judgmental: any clarification containing judgmental
 *   wording is replaced by the deterministic template.
 *
 * Logging: none here (the AI client logs lengths/ids only).
 */
import { generateStructured, getAiMode, prompts, TeachBackClarificationSchema } from "@/lib/ai";
import type { AiResult, StructuredRequest, TeachBackClarification } from "@/lib/ai";
import { getScriptedClarification } from "@/lib/ai/scripted";
import type {
  Language,
  PatientProfile,
  ResponseMode,
  TeachBackAttempt,
  TeachBackQuestion,
  TeachBackScore,
  TeachBackSession,
  VisitDocument,
} from "@/lib/types";
import { containsUnsupportedMedicationDirective } from "./kat-output-guard";
import {
  detectMisconception,
  normalizeAnswer,
  scoreTeachBack as scoreTeachBackPure,
} from "./teach-back-scoring";

export {
  buildConceptGroups,
  detectMisconception,
  normalizeAnswer,
  tokenize,
  VARIATION_OVERLAP_THRESHOLD,
} from "./teach-back-scoring";

/** Maximum attempts per question before the session completes (unresolved → clinician). */
export const MAX_TEACH_BACK_ATTEMPTS = 3;

/** Pure, deterministic scoring (re-exported per ARCHITECTURE §5). */
export function scoreTeachBack(question: TeachBackQuestion, response: string): TeachBackScore {
  return scoreTeachBackPure(question, response);
}

// ---------------------------------------------------------------------------
// Non-judgmental language guard
// ---------------------------------------------------------------------------

/** Words that must never appear in a clarification (checked on normalized text, en + es). */
const JUDGMENTAL_PATTERNS: RegExp[] = [
  /\bwrong\b/,
  /\bfail(?:ed|ure|s|ing)?\b/,
  /\bincorrect(?:ly)?\b/,
  /\bmistake[ns]?\b/,
  /\bincorrect[oa]s?\b/,
  /\bequivocad[oa]s?\b/,
  /\bequivoc(?:o|aste|arse)\b/,
  /\bfall(?:o|aste|ido|ida)\b/,
  /\berrone[oa]s?\b/,
];

export function containsJudgmentalLanguage(text: string): boolean {
  const n = normalizeAnswer(text);
  return JUDGMENTAL_PATTERNS.some((re) => re.test(n));
}

// ---------------------------------------------------------------------------
// Deterministic clarification template
// ---------------------------------------------------------------------------

const TEMPLATE = {
  en: {
    opener: "Let me explain that another way.",
    says: (quote: string) => `Your visit summary says: "${quote}"`,
    inOtherWords: (expected: string) => `In other words: ${expected}`,
    retry: "Would you like to try answering again in your own words?",
  },
  es: {
    opener: "Permítame explicarlo de otra manera.",
    says: (quote: string) => `Su resumen de la visita dice: "${quote}"`,
    inOtherWords: (expected: string) => `En otras palabras: ${expected}`,
    retry: "¿Le gustaría intentar responder otra vez con sus propias palabras?",
  },
} satisfies Record<Language, unknown>;

function sentence(text: string): string {
  const t = text.trim();
  return /[.!?…]$/.test(t) ? t : `${t}.`;
}

/**
 * "Let me explain that another way. Your visit summary says: "…". In other
 * words: …" — built only from the question record (source quote + expected
 * answer) and, when detected, the predefined misconception clarification.
 */
export function buildTemplateClarification(
  question: TeachBackQuestion,
  language: Language,
  misunderstanding?: string,
): string {
  const t = TEMPLATE[language] ?? TEMPLATE.en;
  const parts = [
    t.opener,
    t.says(question.sourceRef.quote.trim()),
    misunderstanding ? sentence(misunderstanding) : null,
    sentence(t.inOtherWords(question.expectedAnswer)),
    t.retry,
  ];
  return parts.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// clarify
// ---------------------------------------------------------------------------

export interface ClarifyInput {
  question: TeachBackQuestion;
  response: string;
  document: VisitDocument;
  profile: PatientProfile;
  attemptNumber: number;
}

export interface ClarifyResult {
  clarification: string;
  misunderstanding?: string;
  /** "scripted_demo" for scripted lookups and deterministic templates. */
  mode: ResponseMode;
  /** Model id, only when the text came from Claude. */
  model?: string;
  /** Safe error message when a live call failed and the template was used. */
  error?: string;
}

export interface ClarifyDeps {
  /** Override mode detection (tests). Never taken from the client. */
  mode?: ResponseMode;
  generate?: (
    req: StructuredRequest<TeachBackClarification>,
  ) => Promise<AiResult<TeachBackClarification>>;
  scripted?: (questionId: string, attemptNumber: number) => string | null;
}

function deterministicClarification(input: ClarifyInput, error?: string): ClarifyResult {
  const misunderstanding = detectMisconception(input.question, input.response);
  const clarification = buildTemplateClarification(
    input.question,
    input.profile.language,
    misunderstanding,
  );
  return {
    clarification,
    mode: "scripted_demo",
    ...(misunderstanding ? { misunderstanding } : {}),
    ...(error ? { error } : {}),
  };
}

/**
 * Re-explain the documented fact after an answer that did not match the key.
 * Never changes the answer key; never uses judgmental wording.
 */
export async function clarify(input: ClarifyInput, deps: ClarifyDeps = {}): Promise<ClarifyResult> {
  const mode = deps.mode ?? getAiMode();
  const misunderstanding = detectMisconception(input.question, input.response);

  if (mode === "scripted_demo") {
    const lookup = deps.scripted ?? getScriptedClarification;
    const scripted = lookup(input.question.id, input.attemptNumber);
    if (scripted && scripted.trim() && !containsJudgmentalLanguage(scripted)) {
      return {
        clarification: scripted.trim(),
        mode: "scripted_demo",
        ...(misunderstanding ? { misunderstanding } : {}),
      };
    }
    return deterministicClarification(input);
  }

  const generate = deps.generate ?? generateStructured;
  const { system, user } = prompts.teachBackClarify({
    profile: input.profile,
    document: input.document,
    question: input.question,
    response: input.response,
    misunderstanding,
    attemptNumber: input.attemptNumber,
  });
  const result = await generate({
    system,
    user,
    schema: TeachBackClarificationSchema,
    effort: "medium",
    label: "teach-back",
  });

  if (!result.ok) return deterministicClarification(input, result.error);

  const clarification = result.data.clarification.trim();
  const modelMisunderstanding = result.data.misunderstanding.trim();
  const guardOpts = {
    medicationNames: input.profile.medications.map((m) => m.name),
    document: input.document,
  };
  if (
    !clarification ||
    containsJudgmentalLanguage(clarification) ||
    containsJudgmentalLanguage(modelMisunderstanding) ||
    // Never let a re-explanation direct a medication change (ARCHITECTURE §2.6).
    containsUnsupportedMedicationDirective(clarification, guardOpts) ||
    containsUnsupportedMedicationDirective(modelMisunderstanding, guardOpts)
  ) {
    return deterministicClarification(input);
  }

  const finalMisunderstanding = misunderstanding ?? (modelMisunderstanding || undefined);
  return {
    clarification,
    mode: "live_claude",
    model: result.model,
    ...(finalMisunderstanding ? { misunderstanding: finalMisunderstanding } : {}),
  };
}

// ---------------------------------------------------------------------------
// Session flow
// ---------------------------------------------------------------------------

export function createTeachBackSession(question: TeachBackQuestion): TeachBackSession {
  return {
    questionId: question.id,
    patientId: question.patientId,
    attempts: [],
    clarificationProvided: false,
    savedForClinician: false,
    completed: false,
  };
}

export interface TeachBackDeps extends ClarifyDeps {
  document: VisitDocument;
  profile: PatientProfile;
  now?: () => Date;
  /** Override clarify entirely (tests). */
  clarify?: (input: ClarifyInput) => Promise<ClarifyResult>;
}

/**
 * Score one attempt and return the updated session (input is not mutated).
 * - attempt 1 sets `initialCorrect`; every attempt updates `finalCorrect`.
 * - an incorrect attempt gets a clarification (`clarificationProvided`).
 * - completes when correct or after MAX_TEACH_BACK_ATTEMPTS; an unresolved
 *   session is flagged `savedForClinician`.
 * - a completed session is returned unchanged.
 */
export async function runTeachBackAttempt(
  session: TeachBackSession | undefined,
  question: TeachBackQuestion,
  response: string,
  deps: TeachBackDeps,
): Promise<TeachBackSession> {
  const base = session ?? createTeachBackSession(question);
  if (base.completed) return base;

  const attemptNumber = base.attempts.length + 1;
  const score = scoreTeachBack(question, response);
  const at = (deps.now?.() ?? new Date()).toISOString();

  const attempt: TeachBackAttempt = {
    attemptNumber,
    response,
    matchedConcepts: score.matchedConcepts,
    correct: score.correct,
    at,
  };

  if (!score.correct) {
    const input: ClarifyInput = {
      question,
      response,
      document: deps.document,
      profile: deps.profile,
      attemptNumber,
    };
    const result = deps.clarify
      ? await deps.clarify(input)
      : await clarify(input, { mode: deps.mode, generate: deps.generate, scripted: deps.scripted });
    attempt.clarification = result.clarification;
    attempt.clarificationMode = result.mode;
    const misunderstanding = score.misunderstanding ?? result.misunderstanding;
    if (misunderstanding) attempt.misunderstanding = misunderstanding;
  }

  const attempts = [...base.attempts, attempt];
  const completed = score.correct || attempts.length >= MAX_TEACH_BACK_ATTEMPTS;

  return {
    ...base,
    attempts,
    initialCorrect: attemptNumber === 1 ? score.correct : base.initialCorrect,
    finalCorrect: score.correct,
    clarificationProvided: base.clarificationProvided || attempt.clarification !== undefined,
    completed,
    savedForClinician: base.savedForClinician || (completed && !score.correct),
  };
}

/** Patient chose "save for my clinician" (or the attempts ran out). Pure. */
export function saveForClinician(session: TeachBackSession): TeachBackSession {
  return { ...session, savedForClinician: true };
}
