/**
 * Types for Scripted Demo Mode content (deterministic, predefined responses).
 * All content describes fictional patients and must stay grounded in their
 * fixture documents: every quote is an exact substring of the document text.
 */
import type {
  DocumentId,
  KatActionKind,
  Language,
  PatientId,
  QuestionId,
  QuickPromptId,
  ReferenceId,
  SafetyFlag,
} from "@/lib/types";

export interface ScriptedKatAction {
  kind: KatActionKind;
  label: string;
  /** view_source → { quote }, add_question → { question }, check_understanding → { questionId }. */
  payload?: Record<string, unknown>;
}

export interface ScriptedKatReply {
  content: string;
  referenceIds?: ReferenceId[];
  /** Quotes (exact substrings of the active document) to turn into SourceRefs. */
  sourceQuotes?: string[];
  actions?: ScriptedKatAction[];
}

/** A term to define; `find` is located in the document with an exact indexOf (offsets computed in code). */
export interface ScriptedTerm {
  term: string;
  /** Exact text as it appears in the document (first occurrence is used). */
  find: string;
  definition: string;
  referenceIds: ReferenceId[];
}

export interface ScriptedInterpretationContent {
  whatThisMeans: string;
  terms: ScriptedTerm[];
  /** General education only — never patient-specific risk claims. */
  whatToKnow: string[];
  discussWithProvider: string[];
  unansweredQuestions: string[];
  /** Each starts with "Your summary does not …". */
  limitations: string[];
  safetyFlags: SafetyFlag[];
  referenceIds: ReferenceId[];
}

/** A free-text question Kat can answer in scripted mode. */
export interface ScriptedFreeTextEntry {
  id: string;
  /** Canonical phrasings; matched exactly after slugifyQuestion(). */
  questions: string[];
  /**
   * Keyword sets (slug words / word stems). An entry matches when every keyword
   * of at least one set appears; the set with the most keywords wins.
   */
  keywords: string[][];
  reply: ScriptedKatReply;
}

export interface ScriptedPatientContent {
  patientId: PatientId;
  documentId: DocumentId;
  language: Language;
  interpretation: ScriptedInterpretationContent;
  quickPrompts: Record<QuickPromptId, ScriptedKatReply>;
  freeText: ScriptedFreeTextEntry[];
  /** Two different re-explanations per teach-back question: [attempt 1, attempt 2]. */
  clarifications: Record<QuestionId, readonly [string, string]>;
}
