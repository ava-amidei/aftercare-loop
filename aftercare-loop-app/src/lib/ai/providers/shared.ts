/**
 * Shared request/provider types and helpers for the AI providers.
 *
 * Kept separate from ./index so provider modules can import it without a
 * runtime import cycle. Server-only.
 */
import type Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod/v4";
import type { ResponseMode } from "@/lib/types";
import type { AiResult, AiUsage } from "../errors";

export const DEFAULT_MAX_TOKENS = 16000;

export type AiEffort = "low" | "medium" | "high";

/** Conversation turn shape (kept as the Anthropic param type for backwards compatibility). */
export type HistoryMessage = Anthropic.MessageParam;

export interface BaseRequest {
  system: string;
  user: string;
  effort: AiEffort;
  maxTokens?: number;
  /** Prior turns (oldest first). Leading assistant turns and empty turns are dropped. */
  history?: HistoryMessage[];
  /** Short label for logs, e.g. "interpret" or "ask-kat". */
  label?: string;
}

export interface StructuredRequest<T> extends BaseRequest {
  /** Must be a `zod/v4` schema (see schemas.ts). */
  schema: z.ZodType<T>;
}

export type TextRequest = BaseRequest;

export type ProviderId = "gemini" | "anthropic";
export type LiveResponseMode = Exclude<ResponseMode, "scripted_demo">;

export interface AiProvider {
  id: ProviderId;
  /** Human label for UI/logs, e.g. "Gemini". */
  label: string;
  mode: LiveResponseMode;
  /** True when this provider's API key is configured (never exposes the key). */
  hasKey(): boolean;
  /** Configured model id (env override or default). */
  modelId(): string;
  generateStructured<T>(req: StructuredRequest<T>): Promise<AiResult<T>>;
  generateText(req: TextRequest): Promise<AiResult<string>>;
}

export function envKeyPresent(name: string): boolean {
  const key = process.env[name];
  return typeof key === "string" && key.trim().length > 0;
}

function isNonEmptyContent(content: HistoryMessage["content"]): boolean {
  if (typeof content === "string") return content.trim().length > 0;
  return content.length > 0;
}

/** Build the messages array: history must start with a user turn; current user turn last. */
export function buildMessages(user: string, history: HistoryMessage[] = []): HistoryMessage[] {
  const cleaned = history.filter((m) => isNonEmptyContent(m.content));
  const firstUser = cleaned.findIndex((m) => m.role === "user");
  const trimmed = firstUser === -1 ? [] : cleaned.slice(firstUser);
  return [...trimmed, { role: "user", content: user }];
}

export function sumUsage(total: AiUsage | undefined, input?: number, output?: number): AiUsage | undefined {
  if (input === undefined && output === undefined) return total;
  const base = total ?? { input: 0, output: 0 };
  return { input: base.input + (input ?? 0), output: base.output + (output ?? 0) };
}

/**
 * Logging rule (ARCHITECTURE §2.10): never log prompts, document text, model
 * output or keys. Only label, provider, mode, model, lengths, status, attempt, ms.
 */
export function logAi(event: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) return;
  console.info("[ai]", JSON.stringify(event));
}
