/**
 * Pure helpers for Check My Understanding (SPEC §3F, §12.6).
 * Correctness is decided ONLY server-side by deterministic scoring against the
 * question record; nothing here grades answers.
 */
import type {
  PatientGroundTruth,
  QuestionId,
  ResponseMode,
  SafetyVerdict,
  TeachBackAttempt,
  TeachBackQuestion,
  TeachBackSession,
} from "@/lib/types";

/** Teach-back questions for the active document only (condition-agnostic). */
export function questionsForDocument(
  groundTruth: PatientGroundTruth | undefined,
  patientId: string,
  documentId: string | undefined,
): TeachBackQuestion[] {
  if (!groundTruth || !documentId || groundTruth.patientId !== patientId) return [];
  return groundTruth.teachBackQuestions.filter(
    (q) => q.patientId === patientId && q.documentId === documentId,
  );
}

/** Index of a deep-linked question (?questionId=), else 0. */
export function initialQuestionIndex(questions: TeachBackQuestion[], questionId?: string | null): number {
  if (!questionId) return 0;
  const i = questions.findIndex((q) => q.id === questionId);
  return i >= 0 ? i : 0;
}

export type QuestionPhase =
  | "unanswered" // no attempts yet
  | "clarified" // last attempt not correct, retry available
  | "correct" // completed correctly
  | "unresolved"; // completed without a correct answer → bring to care team

export function questionPhase(session: TeachBackSession | undefined): QuestionPhase {
  const last = lastAttempt(session);
  if (!session || !last) return "unanswered";
  if (last.correct) return "correct";
  return session.completed ? "unresolved" : "clarified";
}

export function lastAttempt(session: TeachBackSession | undefined): TeachBackAttempt | undefined {
  return session?.attempts[session.attempts.length - 1];
}

/** Most recent clarification shown to the patient, if any. */
export function latestClarification(
  session: TeachBackSession | undefined,
): { text: string; mode?: ResponseMode } | undefined {
  if (!session) return undefined;
  for (let i = session.attempts.length - 1; i >= 0; i--) {
    const a = session.attempts[i];
    if (a.clarification) return { text: a.clarification, mode: a.clarificationMode };
  }
  return undefined;
}

/** Removes a leading opener (e.g. "Let me explain that another way.") already shown as a heading. */
export function stripOpener(text: string, opener: string): string {
  const t = text.trim();
  return t.toLowerCase().startsWith(opener.toLowerCase()) ? t.slice(opener.length).trim() : t;
}

export interface TeachBackSummary {
  total: number;
  answered: number;
  initialCorrect: number;
  finalCorrect: number;
  clarified: number;
  savedForClinician: number;
}

/** Initial vs final correctness across the question set (no pass/fail framing). */
export function summarizeSessions(
  questions: TeachBackQuestion[],
  sessions: Record<QuestionId, TeachBackSession | undefined>,
): TeachBackSummary {
  const out: TeachBackSummary = {
    total: questions.length,
    answered: 0,
    initialCorrect: 0,
    finalCorrect: 0,
    clarified: 0,
    savedForClinician: 0,
  };
  for (const q of questions) {
    const s = sessions[q.id];
    if (!s || s.attempts.length === 0) continue;
    out.answered++;
    if (s.initialCorrect) out.initialCorrect++;
    if (s.finalCorrect) out.finalCorrect++;
    if (s.clarificationProvided) out.clarified++;
    if (s.savedForClinician) out.savedForClinician++;
  }
  return out;
}

export interface TeachBackRequestBody {
  patientId: string;
  questionId: string;
  response: string;
  session?: TeachBackSession;
  language?: "en" | "es";
  explanationLevel?: "simple" | "standard" | "detailed";
}

export interface TeachBackApiResponse {
  session: TeachBackSession;
  clarification?: string;
  clarificationMode?: ResponseMode;
  safety?: SafetyVerdict;
}

export async function postTeachBack(
  body: TeachBackRequestBody,
  fetchImpl: typeof fetch = fetch,
): Promise<TeachBackApiResponse> {
  const res = await fetchImpl("/api/teach-back", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as Partial<TeachBackApiResponse> | null;
  if (!json || !json.session || !Array.isArray(json.session.attempts)) {
    throw new Error("Invalid teach-back response");
  }
  return json as TeachBackApiResponse;
}
