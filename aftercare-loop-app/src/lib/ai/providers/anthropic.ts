/**
 * Anthropic (Claude) provider — the ONLY module that constructs the Anthropic SDK
 * client (it reads ANTHROPIC_API_KEY itself). Server-only (ARCHITECTURE §2.8, §4).
 *
 * Logging rule: never log prompts, document text or model output. Only label,
 * mode, model, character lengths, stop reason, attempt count and duration.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod/v4";
import { aiFailure, mapSdkError, type AiResult, type AiUsage } from "../errors";
import {
  DEFAULT_MAX_TOKENS,
  buildMessages,
  envKeyPresent,
  logAi,
  sumUsage,
  type AiProvider,
  type StructuredRequest,
  type TextRequest,
} from "./shared";

export const ANTHROPIC_DEFAULT_MODEL_ID = "claude-opus-5-5";

export function anthropicModelId(): string {
  const configured = process.env.AFTERCARE_MODEL?.trim();
  return configured ? configured : ANTHROPIC_DEFAULT_MODEL_ID;
}

let client: Anthropic | null = null;

/** Lazily construct the SDK client; null when no key is configured. */
export function getAnthropicSdkClient(): Anthropic | null {
  if (!envKeyPresent("ANTHROPIC_API_KEY")) return null;
  if (!client) client = new Anthropic();
  return client;
}

export function resetAnthropicSdkClientForTests(): void {
  client = null;
}

/** Stable system text is sent as a cacheable block (no-op if below the cache minimum). */
function systemBlocks(system: string): Anthropic.TextBlockParam[] {
  return [{ type: "text", text: system, cache_control: { type: "ephemeral" } }];
}

function addUsage(total: AiUsage | undefined, usage: Anthropic.Usage | undefined): AiUsage | undefined {
  if (!usage) return total;
  return sumUsage(total, usage.input_tokens ?? 0, usage.output_tokens ?? 0);
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

const MAX_STRUCTURED_ATTEMPTS = 2; // initial + one retry on malformed output

export async function anthropicGenerateStructured<T>(req: StructuredRequest<T>): Promise<AiResult<T>> {
  const anthropic = getAnthropicSdkClient();
  if (!anthropic) return aiFailure("unavailable");

  const model = anthropicModelId();
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
        provider: "anthropic",
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
        provider: "anthropic",
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

export async function anthropicGenerateText(req: TextRequest): Promise<AiResult<string>> {
  const anthropic = getAnthropicSdkClient();
  if (!anthropic) return aiFailure("unavailable");

  const model = anthropicModelId();
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
      provider: "anthropic",
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
      provider: "anthropic",
      label: req.label ?? "text",
      model,
      error: err instanceof Error ? err.name : typeof err,
      ms: Date.now() - started,
    });
    return mapSdkError(err);
  }
}

export const anthropicProvider: AiProvider = {
  id: "anthropic",
  label: "Claude",
  mode: "live_claude",
  hasKey: () => envKeyPresent("ANTHROPIC_API_KEY"),
  modelId: anthropicModelId,
  generateStructured: anthropicGenerateStructured,
  generateText: anthropicGenerateText,
};
