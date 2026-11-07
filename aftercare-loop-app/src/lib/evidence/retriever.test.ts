import { describe, expect, it } from "vitest";
import type { EvidenceReference } from "@/lib/types";
import { references } from "@/data/evidence";
import {
  extractTopics,
  getReference,
  getReferences,
  normalizeTopics,
  retrieveEvidence,
  stem,
} from "./retriever";

const ids = (matches: { reference: EvidenceReference }[]) => matches.map((m) => m.reference.id);

describe("extractTopics", () => {
  it("maps synonyms to canonical tags", () => {
    expect(extractTopics("I was told I have polycystic ovaries")).toContain("pcos");
    expect(extractTopics("Is this just the baby blues?")).toContain("postpartum depression");
    expect(extractTopics("My Synthroid dose")).toContain("levothyroxine");
    expect(extractTopics("What is my HbA1c?")).toContain("a1c");
    expect(extractTopics("transvaginal ultrasound next week")).toContain("pelvic ultrasound");
    expect(extractTopics("Postural orthostatic tachycardia syndrome")).toContain("pots");
  });

  it("handles Spanish and diacritics", () => {
    expect(extractTopics("síndrome de ovario poliquístico")).toContain("pcos");
    expect(extractTopics("depresión posparto")).toContain("postpartum depression");
    expect(extractTopics("presión arterial alta")).toContain("hypertension");
  });

  it("adds compound and implied tags", () => {
    const t = extractTopics("Can I keep using my asthma inhaler while pregnant?");
    expect(t).toEqual(expect.arrayContaining(["asthma", "pregnancy", "asthma in pregnancy"]));
    expect(extractTopics("warning signs after delivery")).toContain("postpartum warning signs");
    expect(extractTopics("baby blues")).toContain("mental health");
  });

  it("matches whole words only and does not map symptoms to diagnoses", () => {
    expect(extractTopics("I like the transportation museum")).toContain("transportation");
    expect(extractTopics("endorsement")).not.toContain("endometriosis");
    // A symptom alone never yields a condition tag.
    expect(extractTopics("I have painful periods")).not.toContain("endometriosis");
    expect(extractTopics("")).toEqual([]);
  });

  it("is deterministic and sorted", () => {
    const a = extractTopics("PCOS and metformin and A1C");
    expect(a).toEqual([...a].sort());
    expect(extractTopics("PCOS and metformin and A1C")).toEqual(a);
  });
});

describe("normalizeTopics", () => {
  it("accepts known tags and free-text condition labels", () => {
    expect(normalizeTopics(["PCOS"])).toContain("pcos");
    expect(normalizeTopics(["Polycystic ovary syndrome (documented)"])).toContain("pcos");
    const t = normalizeTopics(["hypertension", "  "]);
    expect(t).toContain("hypertension");
    expect(t).not.toContain("");
  });
});

describe("retrieveEvidence", () => {
  it("insufficient evidence returns empty array for unknown topic", () => {
    expect(retrieveEvidence({ query: "xylophone maintenance schedule", topics: ["xylophone"] })).toEqual([]);
    expect(retrieveEvidence({ query: "", topics: [] })).toEqual([]);
    expect(retrieveEvidence({ topics: ["lupus"] })).toEqual([]);
  });

  it("does not return unrelated pages for generic questions", () => {
    expect(retrieveEvidence({ query: "how is it diagnosed and treated?" })).toEqual([]);
  });

  it("weights exact topic hits highest", () => {
    const res = retrieveEvidence({ topics: ["pcos"], language: "en" });
    expect(res.length).toBeGreaterThan(0);
    for (const m of res) expect(m.matchedTopics).toContain("pcos");
    expect(res[0].reference.topics).toContain("pcos");
  });

  it("returns scores in 0..1, sorted by relevance before diversity, with matched topics", () => {
    const res = retrieveEvidence({ query: "What does my A1C test result mean for type 2 diabetes?", limit: 10 });
    expect(res.length).toBeGreaterThan(0);
    for (const m of res) {
      expect(m.score).toBeGreaterThan(0);
      expect(m.score).toBeLessThanOrEqual(1);
    }
    expect(ids(res)).toContain("ref-medlineplus-a1c-test");
    expect(res[0].matchedTopics.length).toBeGreaterThan(0);
  });

  it("respects limit (default 5)", () => {
    expect(retrieveEvidence({ topics: ["pregnancy"] }).length).toBeLessThanOrEqual(5);
    expect(retrieveEvidence({ topics: ["pregnancy"], limit: 2 }).length).toBe(2);
    expect(retrieveEvidence({ topics: ["pregnancy"], limit: 0 })).toEqual([]);
  });

  it("boosts the requested language", () => {
    const es = retrieveEvidence({ topics: ["pcos"], language: "es" });
    expect(es[0].reference.language).toBe("es");
    expect(es[0].reference.id).toBe("ref-medlineplus-es-pcos");
    const en = retrieveEvidence({ topics: ["pcos"], language: "en" });
    expect(en[0].reference.language).toBe("en");
    const esScore = en.find((m) => m.reference.language === "es")?.score ?? 0;
    expect(esScore).toBeLessThan(en[0].score);
  });

  it("maps baby blues to postpartum depression references", () => {
    const res = retrieveEvidence({ query: "Is feeling weepy just the baby blues?", language: "en" });
    expect(res.length).toBeGreaterThan(0);
    expect(res[0].reference.topics).toContain("postpartum depression");
  });

  it("finds access-barrier resources (transportation / cost)", () => {
    const res = retrieveEvidence({ query: "I don't have a car and can't afford the copay", limit: 5 });
    const found = ids(res);
    expect(found).toEqual(expect.arrayContaining(["ref-hrsa-find-a-health-center"]));
    expect(res.every((m) => m.matchedTopics.some((t) => ["transportation", "financial assistance"].includes(t)))).toBe(
      true,
    );
  });

  it("surfaces emergency warning-sign and crisis resources", () => {
    expect(ids(retrieveEvidence({ query: "postpartum warning signs" }))).toContain("ref-cdc-hear-her-warning-signs");
    expect(ids(retrieveEvidence({ query: "988 crisis line" }))).toContain("ref-samhsa-988-lifeline");
  });

  it("applies kind diversity in the top results", () => {
    const res = retrieveEvidence({ topics: ["pcos"], language: "en", limit: 4 });
    const kinds = new Set(res.map((m) => m.reference.kind));
    expect(kinds.has("clinical_guideline")).toBe(true);
    expect(kinds.size).toBeGreaterThan(1);
  });

  it("supports kind filters and excludeIds", () => {
    const guidelines = retrieveEvidence({ topics: ["pcos"], kinds: ["clinical_guideline"] });
    expect(guidelines.every((m) => m.reference.kind === "clinical_guideline")).toBe(true);
    const excluded = retrieveEvidence({ topics: ["pcos"], excludeIds: ["ref-medlineplus-pcos"], limit: 10 });
    expect(ids(excluded)).not.toContain("ref-medlineplus-pcos");
  });

  it("is deterministic", () => {
    const input = { query: "levothyroxine and my TSH level", language: "en" as const, limit: 5 };
    expect(retrieveEvidence(input)).toEqual(retrieveEvidence(input));
  });

  it("accepts an injected index (pure)", () => {
    const fake: EvidenceReference = {
      id: "ref-test-fake",
      title: "Fake Topic Page",
      organization: "Test Org",
      url: "https://example.org/fake",
      kind: "patient_education",
      topics: ["pcos"],
      accessedAt: "2026-11-07",
      summary: "Test-only record.",
      language: "en",
    };
    expect(ids(retrieveEvidence({ topics: ["pcos"] }, [fake]))).toEqual(["ref-test-fake"]);
    expect(retrieveEvidence({ topics: ["pcos"] }, [])).toEqual([]);
  });

  it("only returns references from the curated index (never fabricates)", () => {
    const known = new Set(references.map((r) => r.id));
    for (const q of ["PCOS", "postpartum", "iron pills", "POTS", "migraine", "perimenopause"]) {
      for (const m of retrieveEvidence({ query: q, limit: 10 })) expect(known.has(m.reference.id)).toBe(true);
    }
  });
});

describe("getReference / getReferences", () => {
  it("resolves known ids and drops unknown ones", () => {
    expect(getReference("ref-ninds-pots")?.organization).toMatch(/NINDS/);
    expect(getReference("ref-made-up")).toBeUndefined();
    expect(getReferences(["ref-ninds-pots", "ref-made-up", "ref-ninds-pots"]).map((r) => r.id)).toEqual([
      "ref-ninds-pots",
    ]);
  });
});

describe("stem", () => {
  it("strips common suffixes", () => {
    expect(stem("supplements")).toBe("supplement");
    expect(stem("therapies")).toBe("therapy");
    expect(stem("monitoring")).toBe("monitor");
    expect(stem("tsh")).toBe("tsh");
  });
});
