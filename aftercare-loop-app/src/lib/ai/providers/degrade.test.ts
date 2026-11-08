// @vitest-environment node
/**
 * End-to-end (mocked) check that services route through the Gemini provider
 * and degrade honestly when the free tier rate-limits: client.generateStructured
 * → providers/gemini → 429 → service falls back to scripted/heuristic output
 * labelled "scripted_demo". No real API calls.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => {
  const create = vi.fn();
  class GoogleGenAI {
    interactions = { create };
  }
  class FakeApiError extends Error {
    status: number;
    constructor(status: number) {
      super(`status ${status}`);
      this.status = status;
    }
  }
  return { GoogleGenAI, FakeApiError, create };
});
vi.mock("@google/genai", () => ({ GoogleGenAI: sdk.GoogleGenAI }));

import { groundTruths } from "@/data/ground-truth";
import { getDocument, getPatient, patientFixtures } from "@/data/patients";
import { resetAnthropicClientForTests } from "../client";
import { clarify } from "@/lib/services/teach-back";
import { interpretDocument } from "@/lib/services/document-interpreter";
import { GEMINI_RATE_LIMIT_MESSAGE } from "./gemini";

const fixture = patientFixtures[0];

function ok(text: string) {
  return {
    status: "completed",
    model: "gemini-3.8-flash",
    output_text: text,
    usage: { total_input_tokens: 1, total_output_tokens: 1 },
  };
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("GEMINI_API_KEY", "gemini-test-key-not-real");
  vi.stubEnv("ANTHROPIC_API_KEY", "");
  vi.stubEnv("AFTERCARE_PROVIDER", "");
  vi.stubEnv("AFTERCARE_FORCE_SCRIPTED", "");
  resetAnthropicClientForTests();
  sdk.create.mockReset();
});

afterEach(() => vi.unstubAllEnvs());

describe("services on the Gemini provider", () => {
  it("interpretation: live success is labelled live_gemini with the model id", async () => {
    const quote = fixture.document.text.slice(0, 40);
    sdk.create.mockResolvedValue(
      ok(
        JSON.stringify({
          whatThisMeans: "Overview.",
          terms: [],
          whatToKnow: [],
          discussWithProvider: [],
          instructions: [{ description: "Follow the documented step.", type: "other", sourceQuote: quote, dueDate: null }],
          unansweredQuestions: [],
          limitations: [],
          safetyFlags: [],
          referenceIds: [],
        }),
      ),
    );
    const out = await interpretDocument({ profile: fixture.profile, document: fixture.document, evidence: [] });
    expect(out.meta.mode).toBe("live_gemini");
    expect(out.meta.model).toBe("gemini-3.8-flash");
    expect(sdk.create).toHaveBeenCalled();
    expect(sdk.create.mock.calls[0][0].generation_config.thinking_level).toBe("medium");
  });

  it("interpretation: 429 degrades to heuristic output labelled scripted_demo", async () => {
    sdk.create.mockRejectedValue(new sdk.FakeApiError(429));
    const out = await interpretDocument(
      { profile: fixture.profile, document: fixture.document, evidence: [] },
      { scripted: () => null },
    );
    expect(out.meta.mode).toBe("scripted_demo");
    expect(out.meta.model).toBeUndefined();
    expect(out.limitations.join(" ")).toMatch(/Live AI unavailable/);
  });

  it("teach-back clarify: 429 falls back to the deterministic template with the friendly error", async () => {
    sdk.create.mockRejectedValue(new sdk.FakeApiError(429));
    const q = groundTruths.flatMap((g) => g.teachBackQuestions)[0];
    const document = getDocument(q.documentId)!;
    const profile = getPatient(q.patientId)!;
    const r = await clarify(
      { question: q, response: "I'm not sure", document, profile, attemptNumber: 1 },
      { scripted: () => null },
    );
    expect(r.mode).toBe("scripted_demo");
    expect(r.error).toBe(GEMINI_RATE_LIMIT_MESSAGE);
    expect(sdk.create.mock.calls[0][0].generation_config.thinking_level).toBe("low");
  });
});
