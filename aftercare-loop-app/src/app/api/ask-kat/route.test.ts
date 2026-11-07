// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST } from "./route";
import type { KatResponse } from "@/lib/types";

const saved = { ...process.env };
beforeAll(() => {
  process.env.AFTERCARE_FORCE_SCRIPTED = "true";
});
afterAll(() => {
  process.env = saved;
});

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/ask-kat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/ask-kat", () => {
  it("answers a quick prompt for a fixture patient", async () => {
    const res = await post({
      patientId: "pt-a-pcos",
      message: "What should I ask my doctor?",
      quickPrompt: "what_should_i_ask",
      history: [],
      context: { actions: [], savedQuestions: [] },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as KatResponse;
    expect(json.message.role).toBe("assistant");
    expect(json.message.actions?.some((a) => a.kind === "add_question")).toBe(true);
  });

  it("uses the client-edited profile language for the same patient", async () => {
    const res = await post({
      patientId: "pt-a-pcos",
      message: "Help me plan my next steps",
      quickPrompt: "plan_next_steps",
      history: [],
      profile: { id: "pt-a-pcos", language: "es" },
    });
    const json = (await res.json()) as KatResponse;
    expect(json.message.content).toMatch(/Entender mi salud/);
  });

  it("returns emergency guidance first", async () => {
    const res = await post({
      patientId: "pt-b-postpartum",
      message: "I'm soaking through a pad every hour and feel faint",
      history: [],
    });
    const json = (await res.json()) as KatResponse;
    expect(json.safety.level).toBe("emergency");
    expect(json.message.actions).toEqual([]);
  });

  it("rejects invalid bodies, unknown patients and cross-patient context", async () => {
    expect((await post({ patientId: "pt-a-pcos" })).status).toBe(400);
    expect((await post({ patientId: "pt-zz", message: "hi", history: [] })).status).toBe(404);
    expect(
      (await post({ patientId: "pt-a-pcos", message: "hi", history: [], profile: { id: "pt-b-postpartum" } })).status,
    ).toBe(400);
    expect(
      (
        await post({
          patientId: "pt-b-postpartum",
          message: "hi",
          history: [],
          context: { documentId: "doc-pt-a-visit-001" },
        })
      ).status,
    ).toBe(400);
  });
});
