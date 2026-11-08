/**
 * Typed results and SDK error mapping for every Claude call.
 *
 * Error strings here are SAFE: they never include prompt text, document text or
 * raw model output, so callers may surface them in the UI and logs.
 */
import Anthropic from "@anthropic-ai/sdk";

export type AiErrorKind =
  | "refusal"
  | "malformed"
  | "auth"
  | "rate_limit"
  | "api"
  | "unavailable";

export interface AiUsage {
  input: number;
  output: number;
}

export interface AiSuccess<T> {
  ok: true;
  data: T;
  model: string;
  usage?: AiUsage;
}

export interface AiFailure {
  ok: false;
  kind: AiErrorKind;
  error: string;
}

export type AiResult<T> = AiSuccess<T> | AiFailure;

/** Safe, user-presentable messages per failure kind. */
export const AI_ERROR_MESSAGES: Record<AiErrorKind, string> = {
  refusal:
    "Kat can't help with that request. Please contact your care team with this question.",
  malformed:
    "Kat had trouble putting together a reliable answer. Please try again.",
  auth: "Live AI responses are not configured correctly on the server.",
  rate_limit: "Kat is getting a lot of requests right now. Please try again in a moment.",
  api: "Kat couldn't reach the AI service. Please try again.",
  unavailable:
    "Live AI responses are not enabled. Add a provider key (GEMINI_API_KEY or ANTHROPIC_API_KEY) to enable live responses.",
};

export function aiFailure(kind: AiErrorKind, error: string = AI_ERROR_MESSAGES[kind]): AiFailure {
  return { ok: false, kind, error };
}

export function isAiFailure<T>(result: AiResult<T>): result is AiFailure {
  return !result.ok;
}

/**
 * Map anything thrown by the SDK to a typed failure. Most-specific class first.
 * The SDK's own message is intentionally NOT forwarded (it can quote request
 * details); only the HTTP status is kept for diagnostics.
 */
export function mapSdkError(err: unknown): AiFailure {
  if (err instanceof Anthropic.AuthenticationError) {
    return aiFailure("auth");
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return aiFailure("auth");
  }
  if (err instanceof Anthropic.RateLimitError) {
    return aiFailure("rate_limit");
  }
  if (err instanceof Anthropic.APIError) {
    const status = typeof err.status === "number" ? ` (status ${err.status})` : "";
    return aiFailure("api", `${AI_ERROR_MESSAGES.api}${status}`);
  }
  return aiFailure("api");
}
