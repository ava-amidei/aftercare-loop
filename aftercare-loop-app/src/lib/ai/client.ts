/**
 * AI client — routes every live call to the configured provider
 * (./providers: Gemini or Anthropic) and decides Scripted Demo Mode.
 * Server-only: never import from a "use client" component. API keys are read
 * only inside ./providers/* (ARCHITECTURE §2.8) and never logged.
 *
 * Every export from the original Claude-only client is preserved so services
 * need no changes.
 */
import type Anthropic from "@anthropic-ai/sdk";
import type { ResponseMode } from "@/lib/types";
import { aiFailure, type AiResult } from "./errors";
import {
  ANTHROPIC_DEFAULT_MODEL_ID,
  getAnthropicSdkClient,
  resetAnthropicSdkClientForTests,
} from "./providers/anthropic";
import { resetGeminiClientForTests } from "./providers/gemini";
import { getActiveProvider } from "./providers";
import type { StructuredRequest, TextRequest } from "./providers/shared";

export {
  DEFAULT_MAX_TOKENS,
  buildMessages,
  type AiEffort,
  type BaseRequest,
  type StructuredRequest,
  type TextRequest,
} from "./providers/shared";
export { getActiveProvider, getProviderSetting, type ProviderSetting } from "./providers";
export type { AiProvider, ProviderId } from "./providers/shared";
export { GEMINI_DEFAULT_MODEL_ID } from "./providers/gemini";

/** Default Claude model id (kept for backwards compatibility). */
export const DEFAULT_MODEL_ID = ANTHROPIC_DEFAULT_MODEL_ID;

// ---------------------------------------------------------------------------
// Mode, model, client
// ---------------------------------------------------------------------------

/** "live_gemini" / "live_claude" when a provider is configured; else "scripted_demo". */
export function getAiMode(): ResponseMode {
  return getActiveProvider()?.mode ?? "scripted_demo";
}

/** True for any live_* mode. */
export function isLiveMode(): boolean {
  return getAiMode() !== "scripted_demo";
}

/** Model id of the active provider; the Claude default when scripted. */
export function getModelId(): string {
  const provider = getActiveProvider();
  if (provider) return provider.modelId();
  const configured = process.env.AFTERCARE_MODEL?.trim();
  return configured ? configured : DEFAULT_MODEL_ID;
}

/** Human label of the active provider ("Gemini" | "Claude"), or null when scripted. */
export function getProviderLabel(): string | null {
  return getActiveProvider()?.label ?? null;
}

/**
 * Lazily constructed Anthropic SDK client. Null unless Claude is the active
 * provider, so no client is ever built without a key.
 */
export function getAnthropicClient(): Anthropic | null {
  if (getActiveProvider()?.id !== "anthropic") return null;
  return getAnthropicSdkClient();
}

/** Test hook: drop cached SDK clients so env changes take effect. */
export function resetAnthropicClientForTests(): void {
  resetAnthropicSdkClientForTests();
  resetGeminiClientForTests();
}

// ---------------------------------------------------------------------------
// Routed calls
// ---------------------------------------------------------------------------

export async function generateStructured<T>(req: StructuredRequest<T>): Promise<AiResult<T>> {
  const p = getActiveProvider();
  if (!p) return aiFailure("unavailable");
  return p.generateStructured(req);
}

export async function generateText(req: TextRequest): Promise<AiResult<string>> {
  const p = getActiveProvider();
  if (!p) return aiFailure("unavailable");
  return p.generateText(req);
}
