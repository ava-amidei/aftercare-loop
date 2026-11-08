/**
 * Provider selection (server-only).
 *
 *   AFTERCARE_FORCE_SCRIPTED=true  → always Scripted Demo Mode (wins over everything)
 *   AFTERCARE_PROVIDER=auto (default) → gemini if GEMINI_API_KEY, else anthropic if
 *                                       ANTHROPIC_API_KEY, else scripted
 *   AFTERCARE_PROVIDER=gemini|anthropic → that provider only if its key is set, else scripted
 *   AFTERCARE_PROVIDER=scripted        → scripted
 */
import { anthropicProvider } from "./anthropic";
import { geminiProvider } from "./gemini";
import type { AiProvider, ProviderId } from "./shared";

export * from "./shared";
export { anthropicProvider } from "./anthropic";
export { geminiProvider } from "./gemini";

export type ProviderSetting = "auto" | ProviderId | "scripted";

export const PROVIDERS: Record<ProviderId, AiProvider> = {
  gemini: geminiProvider,
  anthropic: anthropicProvider,
};

/** Parsed AFTERCARE_PROVIDER; unknown/empty values fall back to "auto". */
export function getProviderSetting(): ProviderSetting {
  const raw = process.env.AFTERCARE_PROVIDER?.trim().toLowerCase();
  if (raw === "gemini" || raw === "anthropic" || raw === "scripted") return raw;
  if (raw === "claude") return "anthropic";
  return "auto";
}

/** The provider that live calls go to, or null for Scripted Demo Mode. */
export function getActiveProvider(): AiProvider | null {
  if (process.env.AFTERCARE_FORCE_SCRIPTED === "true") return null;
  const setting = getProviderSetting();
  if (setting === "scripted") return null;
  if (setting === "auto") {
    if (geminiProvider.hasKey()) return geminiProvider;
    if (anthropicProvider.hasKey()) return anthropicProvider;
    return null;
  }
  const chosen = PROVIDERS[setting];
  return chosen.hasKey() ? chosen : null;
}
