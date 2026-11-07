/**
 * POST /api/teach-back
 * Body: { patientId, questionId, response, session?, language?, explanationLevel? }
 * → { session, clarification?, clarificationMode?, safety? }
 *
 * - The question (and its answer key) is looked up server-side from ground truth;
 *   the client never supplies the key or the mode.
 * - Deterministic safety rules run on the response BEFORE scoring or any model
 *   call. An emergency returns guidance only and does not record an attempt.
 * - Never logs or echoes the response text.
 */
import { z } from "zod";
import { RouteError, withJsonBody } from "@/app/api/_lib/handler";
import { getGroundTruth } from "@/data/ground-truth";
import { getDocument, getPatient } from "@/data/patients";
import { evaluateSafety } from "@/lib/safety";
import { runTeachBackAttempt } from "@/lib/services/teach-back";
import type { SafetyVerdict, TeachBackSession } from "@/lib/types";

const AttemptSchema = z.object({
  attemptNumber: z.number().int().min(1).max(10),
  response: z.string().max(2000),
  matchedConcepts: z.array(z.string().max(200)).max(50),
  correct: z.boolean(),
  misunderstanding: z.string().max(2000).optional(),
  clarification: z.string().max(4000).optional(),
  clarificationMode: z.enum(["live_claude", "scripted_demo"]).optional(),
  at: z.string().max(64),
});

const SessionSchema = z.object({
  questionId: z.string().min(1).max(200),
  patientId: z.string().min(1).max(200),
  attempts: z.array(AttemptSchema).max(10),
  initialCorrect: z.boolean().optional(),
  finalCorrect: z.boolean().optional(),
  clarificationProvided: z.boolean(),
  savedForClinician: z.boolean(),
  completed: z.boolean(),
});

const BodySchema = z.object({
  patientId: z.string().min(1).max(200),
  questionId: z.string().min(1).max(200),
  response: z.string().trim().min(1).max(2000),
  session: SessionSchema.optional(),
  /** Profile preferences may be edited client-side; only these two are honored. */
  language: z.enum(["en", "es"]).optional(),
  explanationLevel: z.enum(["simple", "standard", "detailed"]).optional(),
});

export interface TeachBackRouteResponse {
  session: TeachBackSession;
  clarification?: string;
  clarificationMode?: "live_claude" | "scripted_demo";
  safety?: SafetyVerdict;
}

export const POST = withJsonBody(
  BodySchema,
  async (body): Promise<TeachBackRouteResponse> => {
    const baseProfile = getPatient(body.patientId);
    const question = getGroundTruth(body.patientId)?.teachBackQuestions.find(
      (q) => q.id === body.questionId,
    );
    if (!baseProfile || !question) throw new RouteError(404, "Question not found.");

    const document = getDocument(question.documentId);
    if (!document) throw new RouteError(404, "Question not found.");

    if (
      body.session &&
      (body.session.questionId !== question.id || body.session.patientId !== body.patientId)
    ) {
      throw new RouteError(400, "Session does not match this question.");
    }

    const profile = {
      ...baseProfile,
      ...(body.language ? { language: body.language } : {}),
      ...(body.explanationLevel ? { explanationLevel: body.explanationLevel } : {}),
    };

    const safety = evaluateSafety(body.response, {
      language: profile.language,
      postpartumContext: Boolean(profile.pregnancyOrPostpartumContext),
    });
    const fallbackSession: TeachBackSession = body.session ?? {
      questionId: question.id,
      patientId: body.patientId,
      attempts: [],
      clarificationProvided: false,
      savedForClinician: false,
      completed: false,
    };
    if (safety.level === "emergency") {
      return { session: fallbackSession, safety };
    }

    const session = await runTeachBackAttempt(body.session, question, body.response, {
      document,
      profile,
    });
    const last = session.attempts[session.attempts.length - 1];
    const added = session.attempts.length > (body.session?.attempts.length ?? 0);

    return {
      session,
      ...(added && last?.clarification
        ? { clarification: last.clarification, clarificationMode: last.clarificationMode }
        : {}),
      ...(safety.level !== "none" ? { safety } : {}),
    };
  },
  { route: "teach-back" },
);
