/**
 * POST /api/interpret — interpret a visit document for a (fictional) patient.
 *
 * Body: { patientId, documentId?, text?, title? }
 *  - text given → a pasted document is built from it (sanitized; > 20,000 chars → 400).
 *    If documentId is also given it is reused, so offsets match the client's copy.
 *  - only documentId → the fixture document is used (must belong to patientId).
 * Returns { document, interpretation }. Offsets in the interpretation index into
 * the RETURNED document text (store that copy, not the raw input).
 *
 * Never logs or echoes document text (logging is metadata-only in withJsonBody).
 * Mode is decided server-side; any client-supplied "mode" is ignored.
 */
import { interpretDocument } from "@/lib/services/document-interpreter";
import { jsonError, withJsonBody } from "../_lib/handler";
import { buildDocumentFromBody, InterpretBodySchema } from "./build-document";

export const POST = withJsonBody(
  InterpretBodySchema,
  async (body) => {
    const built = buildDocumentFromBody(body);
    if (!built.ok) return jsonError(built.status, built.error);
    const interpretation = await interpretDocument({ profile: built.profile, document: built.document });
    return { document: built.document, interpretation };
  },
  { route: "interpret" },
);
