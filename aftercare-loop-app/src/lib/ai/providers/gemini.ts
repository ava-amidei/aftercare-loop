/**
 * Gemini provider (docs/GEMINI-NOTES.md). Server-only: the ONLY app module that
 * reads GEMINI_API_KEY. The key is never logged or returned.
 *
 * Transport: `@google/genai` v3 `client.interactions.create(...)`. If the SDK
 * path answers 400/404 (interactions route unavailable for the model/revision),
 * we retry the same JSON body once over REST
 * (POST /v1beta/interactions, `x-goog-api-key`, `Api-Revision: 2026-05-20`).
 *
 * Structured output: JSON Schema generated from the zod/v4 schema with
 * `z.toJSONSchema`; the model's `output_text` is parsed and validated with zod
 * (Gemini ignores constraints like minLength), retried once on malformed output.
 *
 * Privacy: requests are sent with `store: false` so the API does not keep the
 * interaction. Logging: ids/labels, lengths, status, attempt, duration only.
 */
import { GoogleGenAI } from "@google/genai";
import { z } from "zod/v4";
import { AI_ERROR_MESSAGES, aiFailure, type AiFailure, type AiResult, type AiUsage } from "../errors";
import {
  DEFAULT_MAX_TOKENS,
  buildMessages,
  envKeyPresent,
  logAi,
  sumUsage,
  type AiEffort,
  type AiProvider,
  type BaseRequest,
  type HistoryMessage,
  type StructuredRequest,
  type TextRequest,
} from "./shared";

export const GEMINI_DEFAULT_MODEL_ID = "gemini-3.8-flash";
export const GEMINI_REST_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
export const GEMINI_API_REVISION = "2026-05-20";
/** Free tier can be slow (observed 40–60 s for tiny prompts); bound every call. */
export const GEMINI_TIMEOUT_MS = 120_000;

export const GEMINI_RATE_LIMIT_MESSAGE =
  "Kat is getting a lot of requests right now (the live AI service is rate-limited). Please try again in a minute.";

export function geminiModelId(): string {
  const configured = process.env.AFTERCARE_GEMINI_MODEL?.trim();
  return configured ? configured : GEMINI_DEFAULT_MODEL_ID;
}

function timeoutMs(): number {
  const n = Number(process.env.AFTERCARE_GEMINI_TIMEOUT_MS);
  return Number.isFinite(n) && n > 0 ? n : GEMINI_TIMEOUT_MS;
}

/** chat/teach-back ("medium") → low thinking; interpretation ("high") → medium. */
export function thinkingLevelFor(effort: AiEffort): "low" | "medium" {
  return effort === "high" ? "medium" : "low";
}

// ---------------------------------------------------------------------------
// Wire types (subset we use; identical for SDK and REST)
// ---------------------------------------------------------------------------

interface TextContent {
  type: "text";
  text: string;
}

interface InputStep {
  type: "user_input" | "model_output";
  content: TextContent[];
}

export interface GeminiInteractionBody {
  model: string;
  system_instruction: string;
  input: InputStep[];
  response_format?: { type: "text"; mime_type: "application/json"; schema: Record<string, unknown> };
  generation_config: { max_output_tokens: number; thinking_level: "low" | "medium" };
  store: false;
}

export interface GeminiInteraction {
  status?: string;
  model?: string;
  output_text?: string;
  steps?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  usage?: { total_input_tokens?: number; total_output_tokens?: number };
}

/** Error carrying only an HTTP status (never the response body, which may echo input). */
export class GeminiHttpError extends Error {
  readonly status: number | undefined;
  constructor(status: number | undefined, message = "Gemini request failed") {
    super(status ? `${message} (status ${status})` : message);
    this.name = "GeminiHttpError";
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Request building
// ---------------------------------------------------------------------------

function historyText(content: HistoryMessage["content"]): string {
  if (typeof content === "string") return content;
  return content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
}

export function toGeminiInput(user: string, history?: HistoryMessage[]): InputStep[] {
  return buildMessages(user, history)
    .map((m): InputStep => ({
      type: m.role === "assistant" ? "model_output" : "user_input",
      content: [{ type: "text", text: historyText(m.content) }],
    }))
    .filter((s) => s.content[0].text.length > 0);
}

const schemaCache = new WeakMap<object, Record<string, unknown>>();

/** zod/v4 → JSON Schema (draft 2020-12) without the `$schema` marker. */
export function toGeminiSchema(schema: z.ZodType): Record<string, unknown> {
  const cached = schemaCache.get(schema);
  if (cached) return cached;
  const json = z.toJSONSchema(schema, { unrepresentable: "any" }) as Record<string, unknown>;
  const { $schema: _ignored, ...rest } = json;
  void _ignored;
  schemaCache.set(schema, rest);
  return rest;
}

export function buildInteractionBody(req: BaseRequest, schema?: z.ZodType): GeminiInteractionBody {
  const body: GeminiInteractionBody = {
    model: geminiModelId(),
    system_instruction: req.system,
    input: toGeminiInput(req.user, req.history),
    generation_config: {
      max_output_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
      thinking_level: thinkingLevelFor(req.effort),
    },
    store: false,
  };
  if (schema) {
    body.response_format = { type: "text", mime_type: "application/json", schema: toGeminiSchema(schema) };
  }
  return body;
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

let sdkClient: GoogleGenAI | null = null;

function getGeminiSdkClient(): GoogleGenAI | null {
  if (!envKeyPresent("GEMINI_API_KEY")) return null;
  if (!sdkClient) sdkClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY!.trim() });
  return sdkClient;
}

export function resetGeminiClientForTests(): void {
  sdkClient = null;
}

export function errorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const e = err as { status?: unknown; statusCode?: unknown; cause?: unknown };
  if (typeof e.status === "number") return e.status;
  if (typeof e.statusCode === "number") return e.statusCode;
  if (e.cause && e.cause !== err) return errorStatus(e.cause);
  return undefined;
}

async function createViaRest(body: GeminiInteractionBody): Promise<GeminiInteraction> {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new GeminiHttpError(401, "Gemini key missing");
  const res = await fetch(GEMINI_REST_URL, {
    method: "POST",
    headers: {
      "x-goog-api-key": key,
      "Api-Revision": GEMINI_API_REVISION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs()),
  });
  if (!res.ok) throw new GeminiHttpError(res.status);
  return (await res.json()) as GeminiInteraction;
}

/** SDK first; on 400/404 from the interactions path fall back to REST once. */
export async function createInteraction(
  body: GeminiInteractionBody,
): Promise<{ interaction: GeminiInteraction; transport: "sdk" | "rest" }> {
  const client = getGeminiSdkClient();
  if (!client) throw new GeminiHttpError(401, "Gemini key missing");
  try {
    const interaction = (await client.interactions.create(
      body as unknown as Parameters<GoogleGenAI["interactions"]["create"]>[0],
      { timeout_ms: timeoutMs(), retries: { strategy: "none" } },
    )) as unknown as GeminiInteraction;
    return { interaction, transport: "sdk" };
  } catch (err) {
    const status = errorStatus(err);
    if (status === 400 || status === 404) {
      return { interaction: await createViaRest(body), transport: "rest" };
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Response handling
// ---------------------------------------------------------------------------

/** SDK adds `output_text`; REST does not — concatenate model_output text parts. */
export function extractOutputText(interaction: GeminiInteraction): string {
  if (typeof interaction.output_text === "string" && interaction.output_text.trim()) {
    return interaction.output_text.trim();
  }
  return (interaction.steps ?? [])
    .filter((s) => s.type === "model_output")
    .flatMap((s) => s.content ?? [])
    .map((c) => (c.type === "text" && typeof c.text === "string" ? c.text : ""))
    .join("")
    .trim();
}

function stripFences(text: string): string {
  const m = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(text.trim());
  return m ? m[1] : text;
}

export function parseStructured<T>(text: string, schema: z.ZodType<T>): T | null {
  if (!text) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(stripFences(text)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function usageOf(total: AiUsage | undefined, interaction: GeminiInteraction): AiUsage | undefined {
  const u = interaction.usage;
  if (!u) return total;
  return sumUsage(total, u.total_input_tokens ?? 0, u.total_output_tokens ?? 0);
}

/** 401/403 → auth, 429 → rate_limit, else api (status only; never the body). */
export function mapGeminiError(err: unknown): AiFailure {
  const status = errorStatus(err);
  if (status === 401 || status === 403) return aiFailure("auth");
  if (status === 429) return aiFailure("rate_limit", GEMINI_RATE_LIMIT_MESSAGE);
  const suffix = typeof status === "number" ? ` (status ${status})` : "";
  return aiFailure("api", `${AI_ERROR_MESSAGES.api}${suffix}`);
}

// ---------------------------------------------------------------------------
// Public provider functions
// ---------------------------------------------------------------------------

const MAX_STRUCTURED_ATTEMPTS = 2; // initial + one retry on malformed output

export async function geminiGenerateStructured<T>(req: StructuredRequest<T>): Promise<AiResult<T>> {
  if (!envKeyPresent("GEMINI_API_KEY")) return aiFailure("unavailable");

  const body = buildInteractionBody(req, req.schema);
  const started = Date.now();
  let usage: AiUsage | undefined;

  for (let attempt = 1; attempt <= MAX_STRUCTURED_ATTEMPTS; attempt++) {
    try {
      const { interaction, transport } = await createInteraction(body);
      usage = usageOf(usage, interaction);
      const text = extractOutputText(interaction);

      logAi({
        provider: "gemini",
        label: req.label ?? "structured",
        model: body.model,
        transport,
        attempt,
        status: interaction.status,
        systemChars: req.system.length,
        userChars: req.user.length,
        outputChars: text.length,
        ms: Date.now() - started,
      });

      if (interaction.status === "failed" || interaction.status === "cancelled") {
        return aiFailure("api");
      }
      const data = parseStructured(text, req.schema);
      if (data !== null) {
        return { ok: true, data, model: interaction.model || body.model, usage };
      }
      // Malformed (bad JSON, schema mismatch, truncated, empty) → retry once.
    } catch (err) {
      logAi({
        provider: "gemini",
        label: req.label ?? "structured",
        model: body.model,
        attempt,
        error: err instanceof Error ? err.name : typeof err,
        status: errorStatus(err),
        ms: Date.now() - started,
      });
      return mapGeminiError(err);
    }
  }

  return aiFailure("malformed");
}

export async function geminiGenerateText(req: TextRequest): Promise<AiResult<string>> {
  if (!envKeyPresent("GEMINI_API_KEY")) return aiFailure("unavailable");

  const body = buildInteractionBody(req);
  const started = Date.now();

  try {
    const { interaction, transport } = await createInteraction(body);
    const text = extractOutputText(interaction);
    logAi({
      provider: "gemini",
      label: req.label ?? "text",
      model: body.model,
      transport,
      status: interaction.status,
      systemChars: req.system.length,
      userChars: req.user.length,
      outputChars: text.length,
      ms: Date.now() - started,
    });
    if (interaction.status === "failed" || interaction.status === "cancelled") return aiFailure("api");
    if (!text) return aiFailure("malformed");
    return { ok: true, data: text, model: interaction.model || body.model, usage: usageOf(undefined, interaction) };
  } catch (err) {
    logAi({
      provider: "gemini",
      label: req.label ?? "text",
      model: body.model,
      error: err instanceof Error ? err.name : typeof err,
      status: errorStatus(err),
      ms: Date.now() - started,
    });
    return mapGeminiError(err);
  }
}

export const geminiProvider: AiProvider = {
  id: "gemini",
  label: "Gemini",
  mode: "live_gemini",
  hasKey: () => envKeyPresent("GEMINI_API_KEY"),
  modelId: geminiModelId,
  generateStructured: geminiGenerateStructured,
  generateText: geminiGenerateText,
};
