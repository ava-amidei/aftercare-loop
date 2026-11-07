import { describe, expect, it } from "vitest";
import type { AccessBarrier, Language, PatientProfile } from "@/lib/types";
import { getPatient } from "@/data/patients";
import { ACCESS_BARRIERS } from "@/lib/ai/schemas";
import { BARRIER_LABELS, BARRIER_SUGGESTIONS, suggestBarrierActions } from "./barriers";

const NOW = "2026-11-01T12:00:00.000Z";
const base = getPatient("pt-a-pcos")!;
const profileWith = (barriers: AccessBarrier[], language: Language): PatientProfile => ({ ...base, barriers, language });

/** Phrases that would assert a service exists rather than asking. */
const ASSERTS_AVAILABILITY = [
  /\byour clinic (?:offers|provides|has)\b/i,
  /\b(?:is|are) available\.$/i,
  /\byou (?:can|will) get\b/i,
  /\bsu clínica (?:ofrece|tiene)\b/i,
  /\bpuede obtener\b/i,
];

describe("BARRIER_SUGGESTIONS", () => {
  it("covers every AccessBarrier with 1–2 suggestions in en and es", () => {
    for (const b of ACCESS_BARRIERS) {
      const list = BARRIER_SUGGESTIONS[b];
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list.length).toBeLessThanOrEqual(2);
      for (const s of list) {
        expect(s.en.trim()).not.toBe("");
        expect(s.es.trim()).not.toBe("");
      }
    }
  });

  it("phrases every suggestion as a question and never asserts availability", () => {
    for (const b of ACCESS_BARRIERS) {
      for (const s of BARRIER_SUGGESTIONS[b]) {
        expect(s.en).toMatch(/^Would you like to ask .*\?$/);
        expect(s.es).toMatch(/^¿Le gustaría preguntarle .*\?$/);
        expect(s.en).toMatch(/\bwhether\b/);
        expect(s.es).toMatch(/\bsi\b/);
        for (const re of ASSERTS_AVAILABILITY) {
          expect(s.en).not.toMatch(re);
          expect(s.es).not.toMatch(re);
        }
      }
    }
  });

  it("matches the spec topics per barrier", () => {
    const en = (b: AccessBarrier) => BARRIER_SUGGESTIONS[b].map((s) => s.en).join(" ");
    expect(en("transportation")).toBe(
      "Would you like to ask your clinic whether transportation assistance or a telehealth appointment is available?",
    );
    expect(en("cost_or_insurance")).toMatch(/financial assistance/);
    expect(en("cost_or_insurance")).toMatch(/insurance covers/);
    expect(en("cost_or_insurance")).toMatch(/generic or lower-cost/);
    expect(en("language")).toMatch(/interpreter services/);
    expect(en("scheduling")).toMatch(/early-morning, evening, or telehealth/);
    expect(en("caregiving")).toMatch(/children may come with you/);
    expect(en("caregiving")).toMatch(/telehealth/);
  });
});

describe("suggestBarrierActions", () => {
  it.each(
    ACCESS_BARRIERS.flatMap((b) => (["en", "es"] as const).map((l) => [b, l] as const)),
  )("%s (%s) → administrative ai_suggested questions", (barrier, language) => {
    const items = suggestBarrierActions(profileWith([barrier], language), { now: NOW });
    expect(items).toHaveLength(BARRIER_SUGGESTIONS[barrier].length);
    items.forEach((item, i) => {
      expect(item.description).toBe(BARRIER_SUGGESTIONS[barrier][i]![language]);
      expect(item.addressesBarrier).toBe(barrier);
      expect(item.origin).toBe("ai_suggested");
      expect(item.type).toBe("administrative");
      expect(item.category).not.toBe("care_plan");
      expect(item.sourceVerification).toBe("not_applicable");
      expect(item.sourceRef).toBeUndefined();
      expect(item.status).toBe("pending");
      expect(item.rationale).toBe(
        (language === "es" ? "Sugerido porque usted indicó: " : "Suggested because you reported: ") +
          BARRIER_LABELS[language][barrier],
      );
      expect(item.createdAt).toBe(NOW);
    });
  });

  it("returns nothing without barriers", () => {
    expect(suggestBarrierActions(profileWith([], "en"))).toEqual([]);
  });

  it("ids are stable across runs and languages, and duplicates collapse", () => {
    const en = suggestBarrierActions(profileWith(["transportation", "transportation", "caregiving"], "en"), { now: NOW });
    const es = suggestBarrierActions(profileWith(["transportation", "caregiving"], "es"), { now: NOW });
    expect(en.map((i) => i.id)).toEqual(es.map((i) => i.id));
    expect(new Set(en.map((i) => i.id)).size).toBe(en.length);
  });
});
