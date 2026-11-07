/**
 * POST /api/ask-kat
 * Body: { patientId, message, quickPrompt?, history, profile?, context: { documentId?, document?,
 *         profile?, interpretation?, actions, savedQuestions } } → KatResponse
 *
 * The server re-loads the fixture profile by patientId (client edits are merged
 * only for the same patient) and never trusts a client-supplied mode.
 */
import { RouteError, withJsonBody } from "@/app/api/_lib/handler";
import { askKat } from "@/lib/services/ask-kat";
import {
  AskKatBodySchema,
  PatientMismatchError,
  UnknownPatientError,
  buildKatContextFromBody,
} from "@/lib/services/kat-context";

export const POST = withJsonBody(
  AskKatBodySchema,
  async (body) => {
    let built: ReturnType<typeof buildKatContextFromBody>;
    try {
      built = buildKatContextFromBody(body);
    } catch (err) {
      if (err instanceof UnknownPatientError) throw new RouteError(404, "Unknown patient.");
      if (err instanceof PatientMismatchError) {
        throw new RouteError(400, "Request context does not belong to this patient.");
      }
      throw err;
    }
    return askKat(built.request, built.context);
  },
  { route: "ask-kat" },
);
