/**
 * Server-only barrel for the Claude integration. Do not import from client components
 * (client.ts reads ANTHROPIC_API_KEY). Scripted Demo Mode lives in ./scripted.
 */
export {
  DEFAULT_MAX_TOKENS,
  DEFAULT_MODEL_ID,
  buildMessages,
  generateStructured,
  generateText,
  getAiMode,
  getAnthropicClient,
  getModelId,
  isLiveMode,
  resetAnthropicClientForTests,
  type AiEffort,
  type BaseRequest,
  type StructuredRequest,
  type TextRequest,
} from "./client";
export {
  AI_ERROR_MESSAGES,
  aiFailure,
  isAiFailure,
  mapSdkError,
  type AiErrorKind,
  type AiFailure,
  type AiResult,
  type AiSuccess,
  type AiUsage,
} from "./errors";
export { AI_DISCLAIMER, AI_DISCLAIMER_ES, getDisclaimer, makeMeta } from "./meta";
export * from "./schemas";
export * from "./prompts";
