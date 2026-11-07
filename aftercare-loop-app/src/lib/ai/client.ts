/**
 * Claude client — the ONLY module that reads ANTHROPIC_API_KEY (ARCHITECTURE §2.8, §4).
 * Server-only: never import from a "use client" component.
 *
 * Logging rule: never log prompts, document text or model output. Only label,
 * mode, model, character lengths, stop reason, attempt count and duration.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod/v4";
import type { ResponseMode } from "@/lib/types";
import { aiFailure, mapSdkError, type AiResult, type AiUsage } from "./errors";

export const DEFAULT_MODEL_ID = "claude-opus-5-5";
export const DEFAULT_MAX_TOKENS = 16000;

export type AiEffort = "low" | "medium" | "high";

// ---------------------------------------------------------------------------
// Mode, model, client
// ---------------------------------------------------------------------------

function hasApiKey(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return typeof key === "string" && key.trim().length > 0;
}

/** "live_claude" only when a key is set and scripted mode is not forced. */
export function getAiMode(): ResponseMode {
  if (process.env.AFTERCARE_FORCE_SCRIPTED === "true") return "scripted_demo";
  return hasApiKey() ? "live_claude" : "scripted_demo";
}

export function isLiveMode(): boolean {
  return getAiMode() === "live_claude";
}

export function getModelId(): string {
  const configured = process.env.AFTERCARE_MODEL?.trim();
  return configured ? configured : DEFAULT_MODEL_ID;
}

let client: Anthropic | null = null;

/**
 * Lazily construct the SDK client (it reads ANTHROPIC_API_KEY itself).
 * Returns null in scripted mode so no client is ever built without a key.
 */
export function getAnthropicClient(): Anthropic | null {
  if (!isLiveMode()) return null;
  if (!client) client = new Anthropic();
  return client;
}

/** Test hook: drop the cached client so env changes take effect. */
export function resetAnthropicClientForTests(): void {
  client = null;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

export interface BaseRequest {
  system: string;
  user: string;
  effort: AiEffort;
  maxTokens?: number;
  /** Prior turns (oldest first). Leading assistant turns and empty turns are dropped. */
  history?: Anthropic.MessageParam[];
  /** Short label for logs, e.g. "interpret" or "ask-kat". */
  label?: string;
}

export interface StructuredRequest<T> extends BaseRequest {
  /** Must be a `zod/v4` schema (see schemas.ts). */
  schema: z.ZodType<T>;
}

export type TextRequest = BaseRequest;

function isNonEmptyContent(content: Anthropic.MessageParam["content"]): boolean {
  if (typeof content === "string") return content.trim().length > 0;
  return content.length > 0;
}

/** Build the messages array: history must start with a user turn; current user turn last. */
export function buildMessages(
  user: string,
  history: Anthropic.MessageParam[] = [],
): Anthropic.MessageParam[] {
  const cleaned = history.filter((m) => isNonEmptyContent(m.content));
  const firstUser = cleaned.findIndex((m) => m.role === "user");
  const trimmed = firstUser === -1 ? [] : cleaned.slice(firstUser);
  return [...trimmed, { role: "user", content: user }];
}

/** Stable system text is sent as a cacheable block (no-op if below the cache minimum). */
function systemBlocks(system: string): Anthropic.TextBlockParam[] {
  return [{ type: "text", text: system, cache_control: { type: "ephemeral" } }];
}

function addUsage(total: AiUsage | undefined, usage: Anthropic.Usage | undefined): AiUsage | undefined {
  if (!usage) return total;
  const base = total ?? { input: 0, output: 0 };
  return {
    input: base.input + (usage.input_tokens ?? 0),
    output: base.output + (usage.output_tokens ?? 0),
  };
}

function logAi(event: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) return;
  console.info("[ai]", JSON.stringify(event));
}

/**
 * Wrap zodOutputFormat so a schema/JSON mismatch yields `parsed_output: null`
 * instead of throwing. That lets us inspect `stop_reason` (refusal) and retry.
 */
function nullSafeFormat<T>(schema: z.ZodType<T>) {
  const base = zodOutputFormat(schema);
  return {
    ...base,
    parse(content: string): T | null {
      try {
        return base.parse(content);
      } catch {
        return null;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// generateStructured
// ---------------------------------------------------------------------------

const MAX_STRUCTURED_ATTEMPTS = 2; // initial + one retry on malformed output

export async function generateStructured<T>(req: StructuredRequest<T>): Promise<AiResult<T>> {
  const anthropic = getAnthropicClient();
  if (!anthropic) return aiFailure("unavailable");

  const model = getModelId();
  const started = Date.now();
  const messages = buildMessages(req.user, req.history);
  const format = nullSafeFormat(req.schema);
  let usage: AiUsage | undefined;

  for (let attempt = 1; attempt <= MAX_STRUCTURED_ATTEMPTS; attempt++) {
    try {
      const response = await anthropic.messages.parse({
        model,
        max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
        system: systemBlocks(req.system),
        messages,
        output_config: { effort: req.effort, format },
      });
      usage = addUsage(usage, response.usage);

      logAi({
        label: req.label ?? "structured",
        model,
        attempt,
        stopReason: response.stop_reason,
        systemChars: req.system.length,
        userChars: req.user.length,
        ms: Date.now() - started,
      });

      if (response.stop_reason === "refusal") return aiFailure("refusal");

      const parsed = response.parsed_output;
      if (parsed !== null && parsed !== undefined) {
        return { ok: true, data: parsed, model: response.model || model, usage };
      }
      // Malformed (schema mismatch, truncated at max_tokens, empty) → retry once.
    } catch (err) {
      logAi({
        label: req.label ?? "structured",
        model,
        attempt,
        error: err instanceof Error ? err.name : typeof err,
        ms: Date.now() - started,
      });
      return mapSdkError(err);
    }
  }

  return aiFailure("malformed");
}

// ---------------------------------------------------------------------------
// generateText (non-streaming)
// ---------------------------------------------------------------------------

export async function generateText(req: TextRequest): Promise<AiResult<string>> {
  const anthropic = getAnthropicClient();
  if (!anthropic) return aiFailure("unavailable");

  const model = getModelId();
  const started = Date.now();

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
      system: systemBlocks(req.system),
      messages: buildMessages(req.user, req.history),
      output_config: { effort: req.effort },
    });

    logAi({
      label: req.label ?? "text",
      model,
      stopReason: response.stop_reason,
      systemChars: req.system.length,
      userChars: req.user.length,
      ms: Date.now() - started,
    });

    if (response.stop_reason === "refusal") return aiFailure("refusal");

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!text) return aiFailure("malformed");

    return {
      ok: true,
      data: text,
      model: response.model || model,
      usage: addUsage(undefined, response.usage),
    };
  } catch (err) {
    logAi({
      label: req.label ?? "text",
      model,
      error: err instanceof Error ? err.name : typeof err,
      ms: Date.now() - started,
    });
    return mapSdkError(err);
  }
}
