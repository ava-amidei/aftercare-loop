// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";

// ---------------------------------------------------------------------------
// SDK mock — no real API calls are ever made.
// ---------------------------------------------------------------------------
const sdk = vi.hoisted(() => {
  class AnthropicError extends Error {}
  class APIError extends AnthropicError {
    status: number | undefined;
    constructor(status: number | undefined, message: string) {
      super(message);
      this.status = status;
    }
  }
  class AuthenticationError extends APIError {}
  class PermissionDeniedError extends APIError {}
  class RateLimitError extends APIError {}

  const parse = vi.fn();
  const create = vi.fn();
  const constructed = { count: 0 };

  class Anthropic {
    static AnthropicError = AnthropicError;
    static APIError = APIError;
    static AuthenticationError = AuthenticationError;
    static PermissionDeniedError = PermissionDeniedError;
    static RateLimitError = RateLimitError;
    messages = { parse, create };
    constructor() {
      constructed.count++;
    }
  }
  return {
    Anthropic,
    APIError,
    AuthenticationError,
    RateLimitError,
    parse,
    create,
    constructed,
  };
});

vi.mock("@anthropic-ai/sdk", () => ({
  default: sdk.Anthropic,
  Anthropic: sdk.Anthropic,
  APIError: sdk.APIError,
  AuthenticationError: sdk.AuthenticationError,
  RateLimitError: sdk.RateLimitError,
}));

import {
  DEFAULT_MODEL_ID,
  buildMessages,
  generateStructured,
  generateText,
  getAiMode,
  getAnthropicClient,
  getModelId,
  resetAnthropicClientForTests,
} from "./client";
import { AI_ERROR_MESSAGES, mapSdkError } from "./errors";
import { AI_DISCLAIMER, AI_DISCLAIMER_ES, makeMeta } from "./meta";
import { KatReplySchema, ModelDocumentInterpretationSchema } from "./schemas";

const Schema = z.object({ answer: z.string(), count: z.number() });

interface ParseParams {
  output_config: { format: { parse(content: string): unknown }; effort?: string };
}

/** Simulate client.messages.parse: run the supplied format's parse on `text`. */
function parseReturns(text: string, stop_reason = "end_turn") {
  return (params: ParseParams) =>
    Promise.resolve({
      id: "msg_test",
      model: "claude-opus-5-5",
      stop_reason,
      content: text ? [{ type: "text", text }] : [],
      parsed_output: text ? params.output_config.format.parse(text) : null,
      usage: { input_tokens: 10, output_tokens: 5 },
    });
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("ANTHROPIC_API_KEY", "test-key-not-real");
  vi.stubEnv("GEMINI_API_KEY", "");
  vi.stubEnv("AFTERCARE_PROVIDER", "");
  vi.stubEnv("AFTERCARE_FORCE_SCRIPTED", "");
  vi.stubEnv("AFTERCARE_MODEL", "");
  resetAnthropicClientForTests();
  sdk.parse.mockReset();
  sdk.create.mockReset();
  sdk.constructed.count = 0;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("mode detection", () => {
  it("is live when a key is set", () => {
    expect(getAiMode()).toBe("live_claude");
  });

  it("is scripted when no key is set", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(getAiMode()).toBe("scripted_demo");
    expect(getAnthropicClient()).toBeNull();
    expect(sdk.constructed.count).toBe(0);
  });

  it("is scripted when forced, even with a key", () => {
    vi.stubEnv("AFTERCARE_FORCE_SCRIPTED", "true");
    expect(getAiMode()).toBe("scripted_demo");
  });

  it("returns unavailable without calling the SDK in scripted mode", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const res = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(res).toEqual({ ok: false, kind: "unavailable", error: AI_ERROR_MESSAGES.unavailable });
    const text = await generateText({ system: "s", user: "u", effort: "medium" });
    expect(text.ok).toBe(false);
    expect(sdk.parse).not.toHaveBeenCalled();
    expect(sdk.create).not.toHaveBeenCalled();
  });

  it("uses the default model unless AFTERCARE_MODEL is set", () => {
    expect(getModelId()).toBe(DEFAULT_MODEL_ID);
    expect(DEFAULT_MODEL_ID).toBe("claude-opus-5-5");
    vi.stubEnv("AFTERCARE_MODEL", "claude-custom");
    expect(getModelId()).toBe("claude-custom");
  });

  it("constructs the client lazily and only once", () => {
    expect(sdk.constructed.count).toBe(0);
    getAnthropicClient();
    getAnthropicClient();
    expect(sdk.constructed.count).toBe(1);
  });
});

describe("generateStructured", () => {
  it("returns parsed data on the happy path with the documented params", async () => {
    sdk.parse.mockImplementation(parseReturns(JSON.stringify({ answer: "hi", count: 2 })));
    const res = await generateStructured({
      system: "SYSTEM",
      user: "USER",
      schema: Schema,
      effort: "high",
    });
    expect(res).toEqual({
      ok: true,
      data: { answer: "hi", count: 2 },
      model: "claude-opus-5-5",
      usage: { input: 10, output: 5 },
    });
    expect(sdk.parse).toHaveBeenCalledTimes(1);
    const params = sdk.parse.mock.calls[0][0];
    expect(params.model).toBe("claude-opus-5-5");
    expect(params.max_tokens).toBe(16000);
    expect(params.output_config.effort).toBe("high");
    expect(params.output_config.format.type).toBe("json_schema");
    expect(params).not.toHaveProperty("thinking");
    expect(params).not.toHaveProperty("temperature");
    expect(params).not.toHaveProperty("tool_choice");
    expect(params.system[0].text).toBe("SYSTEM");
    expect(params.messages).toEqual([{ role: "user", content: "USER" }]);
  });

  it("honors maxTokens", async () => {
    sdk.parse.mockImplementation(parseReturns(JSON.stringify({ answer: "a", count: 1 })));
    await generateStructured({ system: "s", user: "u", schema: Schema, effort: "low", maxTokens: 2000 });
    expect(sdk.parse.mock.calls[0][0].max_tokens).toBe(2000);
  });

  it("retries once on malformed output and succeeds", async () => {
    sdk.parse
      .mockImplementationOnce(parseReturns("{not json"))
      .mockImplementationOnce(parseReturns(JSON.stringify({ answer: "ok", count: 3 })));
    const res = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(sdk.parse).toHaveBeenCalledTimes(2);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.count).toBe(3);
      expect(res.usage).toEqual({ input: 20, output: 10 });
    }
  });

  it("returns malformed after two schema mismatches", async () => {
    sdk.parse.mockImplementation(parseReturns(JSON.stringify({ answer: 5 })));
    const res = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(sdk.parse).toHaveBeenCalledTimes(2);
    expect(res).toEqual({ ok: false, kind: "malformed", error: AI_ERROR_MESSAGES.malformed });
  });

  it("treats an empty response (null parsed_output) as malformed", async () => {
    sdk.parse.mockImplementation(parseReturns(""));
    const res = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(sdk.parse).toHaveBeenCalledTimes(2);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.kind).toBe("malformed");
  });

  it("returns refusal without retrying, even if text is unparseable", async () => {
    sdk.parse.mockImplementation(parseReturns("I can't help with that.", "refusal"));
    const res = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(sdk.parse).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ ok: false, kind: "refusal", error: AI_ERROR_MESSAGES.refusal });
  });

  it("maps AuthenticationError to auth", async () => {
    sdk.parse.mockRejectedValue(new sdk.AuthenticationError(401, "invalid x-api-key"));
    const res = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(res).toEqual({ ok: false, kind: "auth", error: AI_ERROR_MESSAGES.auth });
    expect(sdk.parse).toHaveBeenCalledTimes(1);
  });

  it("maps RateLimitError to rate_limit and other APIErrors to api", async () => {
    sdk.parse.mockRejectedValueOnce(new sdk.RateLimitError(429, "slow down"));
    const rl = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(rl.ok === false && rl.kind).toBe("rate_limit");

    sdk.parse.mockRejectedValueOnce(new sdk.APIError(529, "overloaded: SECRET DOCUMENT TEXT"));
    const api = await generateStructured({ system: "s", user: "u", schema: Schema, effort: "medium" });
    expect(api.ok === false && api.kind).toBe("api");
    expect(api.ok === false && api.error).not.toContain("SECRET");
    expect(api.ok === false && api.error).toContain("529");
  });

  it("works with the real model-facing schemas", async () => {
    const reply = {
      content: "Your document says to schedule a follow-up.",
      referenceIds: [],
      sourceQuotes: ["Schedule a follow-up visit."],
      suggestedActions: [{ kind: "view_source", label: "View source", questionText: null, sourceQuote: "Schedule a follow-up visit." }],
      limitations: [],
    };
    sdk.parse.mockImplementation(parseReturns(JSON.stringify(reply)));
    const res = await generateStructured({ system: "s", user: "u", schema: KatReplySchema, effort: "medium" });
    expect(res.ok && res.data).toEqual(reply);
    // Model schema must not ask Claude for offsets.
    const schemaJson = JSON.stringify(sdk.parse.mock.calls[0][0].output_config.format.schema);
    expect(schemaJson).not.toContain('"start"');
  });

  it("builds a strict JSON schema for document interpretation", () => {
    expect(() => z.toJSONSchema(ModelDocumentInterpretationSchema)).not.toThrow();
  });
});

describe("generateText", () => {
  it("concatenates text blocks and passes history", async () => {
    sdk.create.mockResolvedValue({
      model: "claude-opus-5-5",
      stop_reason: "end_turn",
      content: [
        { type: "thinking", thinking: "" },
        { type: "text", text: "Hello " },
        { type: "text", text: "there." },
      ],
      usage: { input_tokens: 3, output_tokens: 2 },
    });
    const res = await generateText({
      system: "s",
      user: "latest",
      effort: "medium",
      history: [
        { role: "assistant", content: "Hi! I'm Kat." },
        { role: "user", content: "first" },
        { role: "assistant", content: "reply" },
      ],
    });
    expect(res).toEqual({ ok: true, data: "Hello there.", model: "claude-opus-5-5", usage: { input: 3, output: 2 } });
    const params = sdk.create.mock.calls[0][0];
    expect(params.output_config).toEqual({ effort: "medium" });
    expect(params).not.toHaveProperty("thinking");
    expect(params.messages).toEqual([
      { role: "user", content: "first" },
      { role: "assistant", content: "reply" },
      { role: "user", content: "latest" },
    ]);
  });

  it("returns refusal and maps errors", async () => {
    sdk.create.mockResolvedValueOnce({ model: "m", stop_reason: "refusal", content: [], usage: {} });
    const refused = await generateText({ system: "s", user: "u", effort: "medium" });
    expect(refused.ok === false && refused.kind).toBe("refusal");

    sdk.create.mockRejectedValueOnce(new sdk.AuthenticationError(401, "bad key"));
    const auth = await generateText({ system: "s", user: "u", effort: "medium" });
    expect(auth.ok === false && auth.kind).toBe("auth");
  });

  it("returns malformed on empty text", async () => {
    sdk.create.mockResolvedValueOnce({ model: "m", stop_reason: "end_turn", content: [], usage: {} });
    const res = await generateText({ system: "s", user: "u", effort: "medium" });
    expect(res.ok === false && res.kind).toBe("malformed");
  });
});

describe("helpers", () => {
  it("buildMessages drops leading assistant and empty turns", () => {
    expect(buildMessages("q", [{ role: "assistant", content: "welcome" }, { role: "user", content: " " }])).toEqual([
      { role: "user", content: "q" },
    ]);
  });

  it("mapSdkError maps unknown throws to a generic api error", () => {
    expect(mapSdkError(new Error("contains document text"))).toEqual({
      ok: false,
      kind: "api",
      error: AI_ERROR_MESSAGES.api,
    });
  });

  it("makeMeta sets mode, disclaimer and ISO timestamp; model only when live", () => {
    const live = makeMeta("live_claude", "claude-opus-5-5");
    expect(live.mode).toBe("live_claude");
    expect(live.model).toBe("claude-opus-5-5");
    expect(live.disclaimer).toBe(AI_DISCLAIMER);
    expect(new Date(live.generatedAt).toISOString()).toBe(live.generatedAt);

    const scripted = makeMeta("scripted_demo", "claude-opus-5-5", "es");
    expect(scripted.model).toBeUndefined();
    expect(scripted.disclaimer).toBe(AI_DISCLAIMER_ES);
  });
});
