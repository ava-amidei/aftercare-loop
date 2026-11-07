/**
 * Request validation + VisitDocument construction for POST /api/interpret.
 * Kept out of route.ts because route modules may only export route fields.
 */
import { z } from "zod";
import { getDocument, getPatient } from "@/data/patients";
import { MAX_DOCUMENT_CHARS, sanitizeDocument } from "@/lib/safety";
import { detectSections } from "@/lib/services/instruction-extraction";
import type { PatientProfile, VisitDocument } from "@/lib/types";
import { stableId } from "@/lib/utils/ids";

const ID = /^[A-Za-z0-9_.:-]{1,128}$/;

export const InterpretBodySchema = z
  .object({
    patientId: z.string().regex(ID),
    documentId: z.string().regex(ID).optional(),
    text: z.string().optional(),
    title: z.string().max(200).optional(),
  })
  .refine((b) => b.documentId !== undefined || (b.text !== undefined && b.text.trim().length > 0), {
    message: "Provide documentId or text.",
    path: ["text"],
  });

export type InterpretBody = z.infer<typeof InterpretBodySchema>;

export const INTERPRET_ERRORS = {
  unknownPatient: "Unknown patient.",
  unknownDocument: "Unknown document for this patient.",
  tooLong: `Document text must be ${MAX_DOCUMENT_CHARS.toLocaleString("en-US")} characters or fewer.`,
  empty: "Document text is empty.",
} as const;

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function cleanTitle(title: string | undefined, fallback: string): string {
  const t = (title ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  return t ? t.slice(0, 200) : fallback;
}

export type BuildDocumentResult =
  | { ok: true; document: VisitDocument; profile: PatientProfile }
  | { ok: false; status: number; error: string };

/** Build and validate the VisitDocument for a request (pure apart from today's date). */
export function buildDocumentFromBody(body: InterpretBody): BuildDocumentResult {
  const profile = getPatient(body.patientId);
  if (!profile) return { ok: false, status: 404, error: INTERPRET_ERRORS.unknownPatient };

  if (body.text === undefined || body.text.trim().length === 0) {
    const fixture = body.documentId ? getDocument(body.documentId) : undefined;
    if (!fixture || fixture.patientId !== profile.id) {
      return { ok: false, status: 404, error: INTERPRET_ERRORS.unknownDocument };
    }
    return { ok: true, document: fixture, profile };
  }

  if (body.text.length > MAX_DOCUMENT_CHARS) {
    return { ok: false, status: 400, error: INTERPRET_ERRORS.tooLong };
  }
  const sanitized = sanitizeDocument(body.text);
  if (sanitized.truncated) return { ok: false, status: 400, error: INTERPRET_ERRORS.tooLong };
  if (sanitized.text.trim().length === 0) return { ok: false, status: 400, error: INTERPRET_ERRORS.empty };

  const text = sanitized.text;
  const fixture = body.documentId ? getDocument(body.documentId) : undefined;
  if (fixture && fixture.patientId !== profile.id) {
    return { ok: false, status: 404, error: INTERPRET_ERRORS.unknownDocument };
  }
  // Unchanged fixture text → keep the fixture (and its declared sections).
  if (fixture && fixture.text === text) return { ok: true, document: fixture, profile };

  const createdAt = todayIso();
  const id = body.documentId ?? stableId("doc-pasted", profile.id, text.length, text);
  const fallbackTitle = profile.language === "es" ? `Resumen pegado — ${createdAt}` : `Pasted visit summary — ${createdAt}`;
  const sections = detectSections(text);
  const document: VisitDocument = {
    id,
    patientId: profile.id,
    title: cleanTitle(body.title, fallbackTitle),
    text,
    ...(sections.length > 0 ? { sections } : {}),
    createdAt,
    source: "pasted",
  };
  return { ok: true, document, profile };
}

