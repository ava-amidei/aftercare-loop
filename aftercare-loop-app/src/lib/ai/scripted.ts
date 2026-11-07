// STUB — replaced by the scripted-content agent (Phase 2). Keep these export names.
// Scripted Demo Mode: deterministic, clearly-labeled responses for the demo patients.
import type {
  DocumentId,
  DocumentInterpretation,
  PatientId,
  QuestionId,
  QuickPromptId,
} from "@/lib/types";

export interface ScriptedKatReply {
  content: string;
  referenceIds?: string[];
  /** Quotes (exact substrings of the active document) to turn into SourceRefs. */
  sourceQuotes?: string[];
  actions?: { kind: string; label: string; payload?: Record<string, unknown> }[];
}

/** Normalize free text to a lookup slug: lowercase, strip punctuation, collapse spaces. */
export function slugifyQuestion(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

export function getScriptedInterpretation(
  _patientId: PatientId,
  _documentId: DocumentId,
): Omit<DocumentInterpretation, "meta"> | null {
  return null;
}

export function getScriptedKatReply(
  _patientId: PatientId,
  _messageOrPrompt: string,
  _quickPrompt?: QuickPromptId,
): ScriptedKatReply | null {
  return null;
}

export function getScriptedClarification(
  _questionId: QuestionId,
  _attemptNumber: number,
): string | null {
  return null;
}

export const SCRIPTED_MODE_LABEL =
  "Scripted Demo Mode — Responses are predefined for demonstration purposes.";
export const SCRIPTED_UNSUPPORTED =
  "This scripted demonstration can't answer that question. Add an ANTHROPIC_API_KEY to enable live responses.";
