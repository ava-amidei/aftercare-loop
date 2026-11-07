/**
 * Client-side calls used by Understand My Health. All AI work happens behind
 * /api/* (keys are server-only); mode is decided server-side and only read here.
 */
import type {
  ActionItem,
  DocumentInterpretation,
  KatResponse,
  PatientSessionState,
  VisitDocument,
} from "@/lib/types";

export class UnderstandApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "UnderstandApiError";
    this.status = status;
  }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

async function postJson<T>(url: string, body: unknown, fetchImpl: FetchLike = fetch): Promise<T> {
  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new UnderstandApiError(0, "network");
  }
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok) {
    const msg =
      json && typeof json === "object" && typeof (json as { error?: unknown }).error === "string"
        ? (json as { error: string }).error
        : `HTTP ${res.status}`;
    throw new UnderstandApiError(res.status, msg);
  }
  if (json === null || typeof json !== "object") throw new UnderstandApiError(res.status, "malformed");
  return json as T;
}

/** Fixture documents are known to the server by id; others must travel in the body. */
const isFixture = (doc: VisitDocument | undefined) => doc?.source === "fixture";

// ---------------------------------------------------------------------------
// POST /api/interpret
// ---------------------------------------------------------------------------

export interface InterpretInput {
  patientId: string;
  text: string;
  /** The current active document, if any; reused only when the text is unchanged. */
  baseDocument?: VisitDocument;
  /** Where the text came from (sets the stored document's `source` for non-fixture text). */
  origin: "pasted" | "uploaded_txt";
  title?: string;
}

export interface InterpretResult {
  document: VisitDocument;
  interpretation: DocumentInterpretation;
}

/** Build the /api/interpret body. A documentId is sent only when the text is exactly that document's text. */
export function buildInterpretBody(input: InterpretInput): Record<string, unknown> {
  const unchanged = input.baseDocument && input.baseDocument.text === input.text;
  if (unchanged && input.baseDocument) {
    return isFixture(input.baseDocument)
      ? { patientId: input.patientId, documentId: input.baseDocument.id }
      : {
          patientId: input.patientId,
          documentId: input.baseDocument.id,
          text: input.text,
          title: input.baseDocument.title,
        };
  }
  return { patientId: input.patientId, text: input.text, ...(input.title ? { title: input.title } : {}) };
}

export async function requestInterpretation(input: InterpretInput, fetchImpl?: FetchLike): Promise<InterpretResult> {
  const result = await postJson<Partial<InterpretResult>>("/api/interpret", buildInterpretBody(input), fetchImpl);
  if (!result.document || !result.interpretation || typeof result.document.text !== "string") {
    throw new UnderstandApiError(200, "malformed");
  }
  const document: VisitDocument =
    result.document.source === "fixture" ? result.document : { ...result.document, source: input.origin };
  return { document, interpretation: result.interpretation };
}

// ---------------------------------------------------------------------------
// POST /api/action-plan
// ---------------------------------------------------------------------------

export function buildActionPlanBody(session: PatientSessionState, document: VisitDocument, interp: DocumentInterpretation) {
  return {
    patientId: session.profile.id,
    documentId: document.id,
    interpretation: {
      documentId: interp.documentId,
      patientId: interp.patientId,
      instructions: interp.instructions,
      discussWithProvider: interp.discussWithProvider,
    },
    existing: session.actions,
    profile: session.profile,
    ...(isFixture(document) ? {} : { document }),
  };
}

export async function requestActionPlan(
  session: PatientSessionState,
  document: VisitDocument,
  interp: DocumentInterpretation,
  fetchImpl?: FetchLike,
): Promise<ActionItem[]> {
  const result = await postJson<{ actions?: ActionItem[] }>(
    "/api/action-plan",
    buildActionPlanBody(session, document, interp),
    fetchImpl,
  );
  if (!Array.isArray(result.actions)) throw new UnderstandApiError(200, "malformed");
  return result.actions;
}

// ---------------------------------------------------------------------------
// POST /api/ask-kat (free-text term / condition question)
// ---------------------------------------------------------------------------

export function buildAskTermBody(session: PatientSessionState, question: string, document?: VisitDocument) {
  const interp = document ? session.interpretations[document.id] : undefined;
  return {
    patientId: session.profile.id,
    message: question.trim(),
    quickPrompt: "free_text" as const,
    history: [],
    profile: session.profile,
    context: {
      ...(document ? { documentId: document.id } : {}),
      ...(document && !isFixture(document) ? { document } : {}),
      ...(interp ? { interpretation: interp } : {}),
      actions: session.actions,
      savedQuestions: session.savedQuestions,
    },
  };
}

export async function askAboutTerm(
  session: PatientSessionState,
  question: string,
  document?: VisitDocument,
  fetchImpl?: FetchLike,
): Promise<KatResponse> {
  const result = await postJson<Partial<KatResponse>>(
    "/api/ask-kat",
    buildAskTermBody(session, question, document),
    fetchImpl,
  );
  if (!result.message || typeof result.message.content !== "string" || !result.safety) {
    throw new UnderstandApiError(200, "malformed");
  }
  return result as KatResponse;
}
