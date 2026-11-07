import { describe, expect, it } from "vitest";
import { advanceRequest, createCareTeamRequest, nextStatus, seedRequests } from "./care-team";

const T0 = "2026-11-01T12:00:00.000Z";
const T1 = "2026-11-01T13:00:00.000Z";

describe("createCareTeamRequest", () => {
  it("creates a simulated, submitted request", () => {
    const r = createCareTeamRequest({
      patientId: "pt-b-postpartum",
      type: "clarification",
      summary: "  Which visit should I schedule first? ",
      details: "Two follow-ups listed",
      relatedActionId: "act-1",
      now: T0,
    });
    expect(r).toMatchObject({
      patientId: "pt-b-postpartum",
      type: "clarification",
      summary: "Which visit should I schedule first?",
      details: "Two follow-ups listed",
      relatedActionId: "act-1",
      status: "submitted",
      createdAt: T0,
      updatedAt: T0,
      simulated: true,
    });
    expect(r.id).toMatch(/^ctr-/);
  });

  it("is deterministic and omits empty optional fields", () => {
    const a = createCareTeamRequest({ patientId: "p", type: "reported_barrier", summary: "x", now: T0 });
    const b = createCareTeamRequest({ patientId: "p", type: "reported_barrier", summary: "x", now: T0 });
    expect(a).toEqual(b);
    expect("details" in a).toBe(false);
    expect("relatedActionId" in a).toBe(false);
  });

  it("rejects an empty summary", () => {
    expect(() => createCareTeamRequest({ patientId: "p", type: "clarification", summary: "   ", now: T0 })).toThrow();
  });
});

describe("advanceRequest state machine", () => {
  it("submitted → in_review → responded → closed → closed", () => {
    let r = createCareTeamRequest({ patientId: "p", type: "clarification", summary: "q", now: T0 });
    const seen = [r.status];
    for (let i = 0; i < 4; i++) {
      r = advanceRequest(r, T1);
      seen.push(r.status);
    }
    expect(seen).toEqual(["submitted", "in_review", "responded", "closed", "closed"]);
    expect(r.simulated).toBe(true);
    expect(r.createdAt).toBe(T0);
  });

  it("does not mutate the input and updates updatedAt", () => {
    const r = createCareTeamRequest({ patientId: "p", type: "clarification", summary: "q", now: T0 });
    const next = advanceRequest(r, T1);
    expect(r.status).toBe("submitted");
    expect(next.updatedAt).toBe(T1);
  });

  it("closed is terminal and returned unchanged", () => {
    const closed = { ...createCareTeamRequest({ patientId: "p", type: "clarification", summary: "q", now: T0 }), status: "closed" as const };
    expect(advanceRequest(closed, T1)).toBe(closed);
    expect(nextStatus("closed")).toBe("closed");
  });
});

describe("seedRequests", () => {
  const seeds = seedRequests("pt-a-pcos", T0);

  it("returns 3–4 fictional, simulated requests covering the dashboard types", () => {
    expect(seeds.length).toBeGreaterThanOrEqual(3);
    expect(seeds.length).toBeLessThanOrEqual(4);
    expect(new Set(seeds.map((s) => s.type))).toEqual(
      new Set(["clarification", "refill_request", "side_effect_question", "reported_barrier"]),
    );
    for (const s of seeds) {
      expect(s.simulated).toBe(true);
      expect(s.patientId).toBe("pt-a-pcos");
      expect(s.summary.startsWith("Fictional example:")).toBe(true);
      expect(new Date(s.createdAt).getTime()).toBeLessThanOrEqual(new Date(T0).getTime());
    }
  });

  it("never claims the app authorizes refills or changes prescriptions", () => {
    const text = seeds.map((s) => `${s.summary} ${s.details ?? ""}`).join(" ");
    expect(text).not.toMatch(/\b(?:approved|authorized|refilled)\b/i);
    expect(seeds.find((s) => s.type === "refill_request")!.details).toMatch(/does not authorize refills/);
  });

  it("has deterministic, unique ids per patient", () => {
    expect(seedRequests("pt-a-pcos", T1).map((s) => s.id)).toEqual(seeds.map((s) => s.id));
    expect(new Set(seeds.map((s) => s.id)).size).toBe(seeds.length);
    expect(seedRequests("pt-b-postpartum", T0)[0]!.id).not.toBe(seeds[0]!.id);
  });
});
