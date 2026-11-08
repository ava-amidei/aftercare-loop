// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";

// ---------------------------------------------------------------------------
// SDK + fetch mocks — no real API calls are ever made.
// ---------------------------------------------------------------------------
const sdk = vi.hoisted(() => {
  const create = vi.fn();
  const constructed: Array<{ apiKey?: string }> = [];
  class GoogleGenAI {
    interactions = { create };
    constructor(opts: { apiKey?: string }) {
      constructed.push(opts);
    }
  }
  /** Mimics the SDK's APIError shape (status + statusCode). */
  class FakeApiError extends Error {
    status: number;
    statusCode: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.statusCode = status;
    }
  }
  return { GoogleGenAI, FakeApiError, create, constructed };
});

vi.mock("@google/genai", () => ({ GoogleGenAI: sdk.GoogleGenAI }));

const anthropicSdk = vi.hoisted(() => {
  const parse = vi.fn();
  const create = vi.fn();
  class APIError extends Error {}
  class Anthropic {
    static APIError = APIError;
    static AuthenticationError = class extends APIError {};
    static PermissionDeniedError = class extends APIError {};
    static RateLimitError = class extends APIError {};
    messages = { parse, create };
  }
  return { Anthropic, parse, create };
});
vi.mock("@anthropic-ai/sdk", () => ({ default: anthropicSdk.Anthropic, Anthropic: anthropicSdk.Anthropic }));

import {
  generateStructured,
  generateText,
  getAiMode,
  getAnthropicClient,
  getModelId,
  getProviderLabel,
  isLiveMode,
  resetAnthropicClientForTests,
} from "../client";
import { AI_ERROR_MESSAGES } from "../errors";
import { makeMeta } from "../meta";
import { KatReplySchema, TeachBackClarificationSchema } from "../schemas";
import { getActiveProvider } from "./index";
import {
  GEMINI_API_REVISION,
  GEMINI_DEFAULT_MODEL_ID,
  GEMINI_RATE_LIMIT_MESSAGE,
  GEMINI_REST_URL,
  buildInteractionBody,
  extractOutputText,
  isTimeoutError,
  mapGeminiError,
  thinkingLevelFor,
  timeoutMs,
  toGeminiInput,
  toGeminiSchema,
} from "./gemini";

const Schema = z.object({
  answer: z.string(),
  count: z.number(),
  tag: z.enum(["a", "b"]),
  note: z.string().nullable(),
  items: z.array(z.boolean()),
  extra: z.string().optional(),
});
const valid = { answer: "hi", count: 2, tag: "a", note: null, items: [true] };

function interaction(text: string, extra: Record<string, unknown> = {}) {
  return {
    status: "completed",
    model: "gemini-3.8-flash",
    output_text: text,
    steps: [{ type: "thought" }, { type: "model_output", content: [{ type: "text", text }] }],
    usage: { total_input_tokens: 10, total_output_tokens: 5, total_thought_tokens: 99 },
    ...extra,
  };
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("GEMINI_API_KEY", "gemini-test-key-not-real");
  vi.stubEnv("ANTHROPIC_API_KEY", "");
  vi.stubEnv("AFTERCARE_PROVIDER", "");
  vi.stubEnv("AFTERCARE_FORCE_SCRIPTED", "");
  vi.stubEnv("AFTERCARE_GEMINI_MODEL", "");
  vi.stubEnv("AFTERCARE_MODEL", "");
  resetAnthropicClientForTests();
  sdk.create.mockReset();
  sdk.constructed.length = 0;
  anthropicSdk.parse.mockReset();
  anthropicSdk.create.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("provider selection", () => {
  it("auto prefers Gemini when GEMINI_API_KEY is set", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-test-key");
    expect(getAiMode()).toBe("live_gemini");
    expect(isLiveMode()).toBe(true);
    expect(getModelId()).toBe(GEMINI_DEFAULT_MODEL_ID);
    expect(GEMINI_DEFAULT_MODEL_ID).toBe("gemini-3.8-flash");
    expect(getProviderLabel()).toBe("Gemini");
    expect(getAnthropicClient()).toBeNull();
  });

  it("auto falls back to Anthropic, then scripted", () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-test-key");
    expect(getAiMode()).toBe("live_claude");
    expect(getModelId()).toBe("claude-opus-5-5");
    vi.stubEnv("ANTHROPIC_API_KEY", " ");
    expect(getAiMode()).toBe("scripted_demo");
    expect(isLiveMode()).toBe(false);
    expect(getActiveProvider()).toBeNull();
  });

  it("explicit AFTERCARE_PROVIDER picks that provider only when its key is set", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-test-key");
    vi.stubEnv("AFTERCARE_PROVIDER", "anthropic");
    expect(getAiMode()).toBe("live_claude");
    vi.stubEnv("AFTERCARE_PROVIDER", "gemini");
    expect(getAiMode()).toBe("live_gemini");
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(getAiMode()).toBe("scripted_demo");
    vi.stubEnv("AFTERCARE_PROVIDER", "scripted");
    vi.stubEnv("GEMINI_API_KEY", "k");
    expect(getAiMode()).toBe("scripted_demo");
  });

  it("AFTERCARE_FORCE_SCRIPTED wins over everything", () => {
    vi.stubEnv("AFTERCARE_FORCE_SCRIPTED", "true");
    vi.stubEnv("AFTERCARE_PROVIDER", "gemini");
    expect(getAiMode()).toBe("scripted_demo");
  });

  it("honors AFTERCARE_GEMINI_MODEL", () => {
    vi.stubEnv("AFTERCARE_GEMINI_MODEL", "gemini-4-argon");
    expect(getModelId()).toBe("gemini-4-argon");
  });

  it("returns unavailable without any network call in scripted mode", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    const res = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(res).toEqual({ ok: false, kind: "unavailable", error: AI_ERROR_MESSAGES.unavailable });
    expect((await generateText({ system: "s", user: "u", effort: "medium" })).ok).toBe(false);
    expect(sdk.create).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("makeMeta records the model for live_gemini", () => {
    expect(makeMeta("live_gemini", "gemini-3.8-flash").model).toBe("gemini-3.8-flash");
    expect(makeMeta("scripted_demo", "gemini-3.8-flash").model).toBeUndefined();
  });
});

describe("request building", () => {
  it("maps effort to thinking_level", () => {
    expect(thinkingLevelFor("low")).toBe("low");
    expect(thinkingLevelFor("medium")).toBe("low");
    expect(thinkingLevelFor("high")).toBe("medium");
  });

  it("converts history into user_input/model_output steps", () => {
    expect(
      toGeminiInput("latest", [
        { role: "assistant", content: "welcome" },
        { role: "user", content: "first" },
        { role: "assistant", content: [{ type: "text", text: "reply" }] },
      ]),
    ).toEqual([
      { type: "user_input", content: [{ type: "text", text: "first" }] },
      { type: "model_output", content: [{ type: "text", text: "reply" }] },
      { type: "user_input", content: [{ type: "text", text: "latest" }] },
    ]);
  });

  it("generates a JSON Schema from zod without $schema", () => {
    const json = toGeminiSchema(Schema);
    expect(json).not.toHaveProperty("$schema");
    expect(json.type).toBe("object");
    const props = json.properties as Record<string, Record<string, unknown>>;
    expect(props.tag.enum).toEqual(["a", "b"]);
    expect(props.note.anyOf).toEqual([{ type: "string" }, { type: "null" }]);
    expect(props.items).toEqual({ type: "array", items: { type: "boolean" } });
    expect(json.required).not.toContain("extra");
    expect(() => toGeminiSchema(KatReplySchema)).not.toThrow();
  });

  it("builds the documented body", () => {
    const body = buildInteractionBody({ system: "SYS", user: "USER", effort: "high", maxTokens: 900 }, Schema);
    expect(body).toMatchObject({
      model: "gemini-3.8-flash",
      system_instruction: "SYS",
      input: [{ type: "user_input", content: [{ type: "text", text: "USER" }] }],
      response_format: { type: "text", mime_type: "application/json" },
      generation_config: { max_output_tokens: 900, thinking_level: "medium" },
      store: false,
    });
    expect(body).not.toHaveProperty("temperature");
  });

  it("extracts text from REST-shaped responses without output_text", () => {
    const i = interaction("{}");
    delete (i as { output_text?: string }).output_text;
    expect(extractOutputText(i)).toBe("{}");
  });
});

describe("generateStructured via Gemini", () => {
  it("parses and validates output_text on the happy path", async () => {
    sdk.create.mockResolvedValue(interaction(JSON.stringify(valid)));
    const res = await generateStructured({ system: "SYSTEM", user: "USER", schema: Schema, effort: "medium", maxTokens: 500 });
    expect(res).toEqual({ ok: true, data: valid, model: "gemini-3.8-flash", usage: { input: 10, output: 5 } });
    expect(sdk.create).toHaveBeenCalledTimes(1);
    const [body, opts] = sdk.create.mock.calls[0];
    expect(body.generation_config).toEqual({ max_output_tokens: 500, thinking_level: "low" });
    expect(body.response_format.schema.type).toBe("object");
    expect(body.system_instruction).toBe("SYSTEM");
    expect(opts.retries).toEqual({ strategy: "none" });
    expect(sdk.constructed).toEqual([{ apiKey: "gemini-test-key-not-real" }]);
  });

  it("accepts fenced JSON", async () => {
    sdk.create.mockResolvedValue(interaction("```json\n" + JSON.stringify(valid) + "\n```"));
    const res = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(res.ok).toBe(true);
  });

  it("retries once on malformed output and sums usage", async () => {
    sdk.create
      .mockResolvedValueOnce(interaction("{not json"))
      .mockResolvedValueOnce(interaction(JSON.stringify(valid)));
    const res = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(sdk.create).toHaveBeenCalledTimes(2);
    expect(res.ok && res.usage).toEqual({ input: 20, output: 10 });
  });

  it("returns malformed after two schema mismatches", async () => {
    sdk.create.mockResolvedValue(interaction(JSON.stringify({ answer: 5 })));
    const res = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(sdk.create).toHaveBeenCalledTimes(2);
    expect(res).toEqual({ ok: false, kind: "malformed", error: AI_ERROR_MESSAGES.malformed });
  });

  it("maps 401/403 → auth, 429 → rate_limit (friendly), others → api without leaking text", async () => {
    sdk.create.mockRejectedValueOnce(new sdk.FakeApiError(401, "API key not valid"));
    expect(await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" })).toEqual({
      ok: false,
      kind: "auth",
      error: AI_ERROR_MESSAGES.auth,
    });
    sdk.create.mockRejectedValueOnce(new sdk.FakeApiError(403, "denied"));
    const forbidden = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(forbidden.ok === false && forbidden.kind).toBe("auth");

    sdk.create.mockRejectedValueOnce(new sdk.FakeApiError(429, "quota"));
    const rl = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(rl).toEqual({ ok: false, kind: "rate_limit", error: GEMINI_RATE_LIMIT_MESSAGE });

    sdk.create.mockRejectedValueOnce(new sdk.FakeApiError(503, "overloaded: SECRET DOCUMENT TEXT"));
    const api = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(api.ok === false && api.kind).toBe("api");
    expect(api.ok === false && api.error).toContain("503");
    expect(api.ok === false && api.error).not.toContain("SECRET");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps network errors without status to api", () => {
    expect(mapGeminiError(new TypeError("fetch failed"))).toEqual({ ok: false, kind: "api", error: AI_ERROR_MESSAGES.api });
  });

  it("maps timeouts (AbortSignal.timeout, SDK RequestTimeoutError, nested cause) to api so callers degrade", () => {
    const abortTimeout = new DOMException("The operation was aborted due to timeout", "TimeoutError");
    expect(isTimeoutError(abortTimeout)).toBe(true);
    expect(mapGeminiError(abortTimeout)).toEqual({ ok: false, kind: "api", error: `${AI_ERROR_MESSAGES.api} (timed out)` });
    const sdkTimeout = Object.assign(new Error("Request timed out"), { name: "RequestTimeoutError" });
    expect(mapGeminiError(sdkTimeout).kind).toBe("api");
    const wrapped = new TypeError("fetch failed", { cause: abortTimeout });
    expect(isTimeoutError(wrapped)).toBe(true);
    expect(isTimeoutError(new TypeError("fetch failed"))).toBe(false);
  });

  it("a timed-out SDK call fails fast as api without a REST retry; AFTERCARE_GEMINI_TIMEOUT_MS bounds the call", async () => {
    vi.stubEnv("AFTERCARE_GEMINI_TIMEOUT_MS", "15000");
    expect(timeoutMs()).toBe(15000);
    sdk.create.mockRejectedValueOnce(Object.assign(new Error("Request timed out"), { name: "RequestTimeoutError" }));
    const res = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(res).toEqual({ ok: false, kind: "api", error: `${AI_ERROR_MESSAGES.api} (timed out)` });
    expect(sdk.create).toHaveBeenCalledTimes(1);
    expect(sdk.create.mock.calls[0][1]).toMatchObject({ timeout_ms: 15000 });
    expect(fetchMock).not.toHaveBeenCalled();
    vi.stubEnv("AFTERCARE_GEMINI_TIMEOUT_MS", "not-a-number");
    expect(timeoutMs()).toBe(120_000);
  });

  it("falls back to REST on SDK 404/400 with the documented headers", async () => {
    sdk.create.mockRejectedValueOnce(new sdk.FakeApiError(404, "not found"));
    const restBody = interaction(JSON.stringify(valid));
    delete (restBody as { output_text?: string }).output_text;
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(restBody), { status: 200 }));
    const res = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "high" });
    expect(res.ok && res.data).toEqual(valid);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(GEMINI_REST_URL);
    expect(init.method).toBe("POST");
    expect(init.headers["x-goog-api-key"]).toBe("gemini-test-key-not-real");
    expect(init.headers["Api-Revision"]).toBe(GEMINI_API_REVISION);
    expect(JSON.parse(init.body).generation_config.thinking_level).toBe("medium");
  });

  it("maps REST 429 after fallback to rate_limit", async () => {
    sdk.create.mockRejectedValueOnce(new sdk.FakeApiError(400, "bad"));
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 429 }));
    const res = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(res.ok === false && res.kind).toBe("rate_limit");
  });

  it("treats a failed interaction as api", async () => {
    sdk.create.mockResolvedValueOnce(interaction("", { status: "failed" }));
    const res = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(res.ok === false && res.kind).toBe("api");
  });

  it("works with a real model-facing schema", async () => {
    const out = { misunderstanding: "Timing of the follow-up.", clarification: "Plain words." };
    sdk.create.mockResolvedValueOnce(interaction(JSON.stringify(out)));
    const res = await generateStructured({ system: "s", user: "u", schema: TeachBackClarificationSchema, effort: "medium" });
    expect(res.ok && res.data).toEqual(out);
    expect(() => toGeminiSchema(TeachBackClarificationSchema)).not.toThrow();
  });
});

describe("generateText via Gemini", () => {
  it("returns output text and usage; sends no response_format", async () => {
    sdk.create.mockResolvedValueOnce(interaction("Hello there."));
    const res = await generateText({ system: "s", user: "u", effort: "medium" });
    expect(res).toEqual({ ok: true, data: "Hello there.", model: "gemini-3.8-flash", usage: { input: 10, output: 5 } });
    expect(sdk.create.mock.calls[0][0]).not.toHaveProperty("response_format");
  });

  it("returns malformed on empty text and maps errors", async () => {
    sdk.create.mockResolvedValueOnce(interaction(""));
    const empty = await generateText({ system: "s", user: "u", effort: "medium" });
    expect(empty.ok === false && empty.kind).toBe("malformed");
    sdk.create.mockRejectedValueOnce(new sdk.FakeApiError(429, "quota"));
    const rl = await generateText({ system: "s", user: "u", effort: "medium" });
    expect(rl.ok === false && rl.kind).toBe("rate_limit");
  });

  it("routes to Anthropic when it is the active provider", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-test-key");
    anthropicSdk.create.mockResolvedValueOnce({
      model: "claude-opus-5-5",
      stop_reason: "end_turn",
      content: [{ type: "text", text: "From Claude." }],
      usage: { input_tokens: 1, output_tokens: 1 },
    });
    const res = await generateText({ system: "s", user: "u", effort: "medium" });
    expect(res.ok && res.data).toBe("From Claude.");
    expect(sdk.create).not.toHaveBeenCalled();
  });
});
