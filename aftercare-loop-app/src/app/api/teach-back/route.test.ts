import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { groundTruths } from "@/data/ground-truth";
import { POST } from "./route";

const q = groundTruths[0]!.teachBackQuestions[0]!;

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/teach-back", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/teach-back", () => {
  const prev = process.env.AFTERCARE_FORCE_SCRIPTED;
  beforeAll(() => {
    process.env.AFTERCARE_FORCE_SCRIPTED = "true";
  });
  afterAll(() => {
    if (prev === undefined) delete process.env.AFTERCARE_FORCE_SCRIPTED;
    else process.env.AFTERCARE_FORCE_SCRIPTED = prev;
  });

  it("400 on invalid body", async () => {
    expect((await post({ patientId: q.patientId })).status).toBe(400);
  });

  it("404 on unknown question", async () => {
    expect((await post({ patientId: q.patientId, questionId: "nope", response: "x" })).status).toBe(404);
  });

  it("wrong → clarification, then correct with session", async () => {
    const r1 = await post({ patientId: q.patientId, questionId: q.id, response: "I'm not sure" });
    expect(r1.status).toBe(200);
    const b1 = await r1.json();
    expect(b1.session.initialCorrect).toBe(false);
    expect(typeof b1.clarification).toBe("string");
    expect(b1.clarificationMode).toBe("scripted_demo");

    const r2 = await post({ patientId: q.patientId, questionId: q.id, response: q.expectedAnswer, session: b1.session });
    const b2 = await r2.json();
    expect(b2.session.finalCorrect).toBe(true);
    expect(b2.session.completed).toBe(true);
    expect(b2.clarification).toBeUndefined();
  });

  it("400 when session belongs to another question", async () => {
    const other = groundTruths[0]!.teachBackQuestions[1]!;
    const session = { questionId: other.id, patientId: q.patientId, attempts: [], clarificationProvided: false, savedForClinician: false, completed: false };
    expect((await post({ patientId: q.patientId, questionId: q.id, response: "x", session })).status).toBe(400);
  });

  it("emergency response returns safety guidance and records no attempt", async () => {
    const r = await post({ patientId: q.patientId, questionId: q.id, response: "I have crushing chest pain and can't breathe" });
    const b = await r.json();
    expect(b.safety.level).toBe("emergency");
    expect(b.session.attempts).toHaveLength(0);
  });
});
