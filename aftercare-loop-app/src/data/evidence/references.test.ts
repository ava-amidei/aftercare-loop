import { describe, expect, it } from "vitest";
import { getReferenceById, references, EVIDENCE_ACCESSED_AT } from "@/data/evidence";

describe("curated evidence index", () => {
  it("has 35–50 references with unique ids and urls", () => {
    expect(references.length).toBeGreaterThanOrEqual(35);
    expect(references.length).toBeLessThanOrEqual(50);
    expect(new Set(references.map((r) => r.id)).size).toBe(references.length);
    expect(new Set(references.map((r) => r.url)).size).toBe(references.length);
  });

  it("every record is well-formed", () => {
    for (const r of references) {
      expect(r.id).toMatch(/^ref-[a-z0-9-]+$/);
      expect(r.url).toMatch(/^https:\/\//);
      expect(r.title.length).toBeGreaterThan(2);
      expect(r.organization.length).toBeGreaterThan(2);
      expect(r.accessedAt).toBe(EVIDENCE_ACCESSED_AT);
      expect(r.topics.length).toBeGreaterThan(0);
      for (const t of r.topics) expect(t).toBe(t.toLowerCase());
      expect(["en", "es"]).toContain(r.language);
      // Short curated summary, 1–2 sentences, not a long excerpt.
      expect(r.summary.length).toBeGreaterThan(20);
      expect(r.summary.length).toBeLessThanOrEqual(320);
    }
  });

  it("includes 5–8 Spanish MedlinePlus pages", () => {
    const es = references.filter((r) => r.language === "es");
    expect(es.length).toBeGreaterThanOrEqual(5);
    expect(es.length).toBeLessThanOrEqual(8);
    for (const r of es) expect(r.url).toMatch(/^https:\/\/medlineplus\.gov\/spanish\//);
  });

  it("only labels a record peer_reviewed if it has a DOI; DOIs resolve via doi.org", () => {
    for (const r of references) {
      if (r.kind === "peer_reviewed") expect(r.doi).toBeTruthy();
      if (r.doi) expect(r.url === `https://doi.org/${r.doi}` || r.url.includes(r.doi)).toBe(true);
    }
  });

  it("does not label non-government publishers as government resources", () => {
    for (const r of references) {
      if (r.kind === "government_resource") expect(r.publisherType).toBe("government");
    }
  });

  it("covers the required topics", () => {
    const tags = new Set(references.flatMap((r) => r.topics));
    for (const t of [
      "pcos",
      "endometriosis",
      "postpartum care",
      "postpartum depression",
      "postpartum warning signs",
      "pots",
      "hypothyroidism",
      "type 2 diabetes",
      "hypertension",
      "gestational diabetes",
      "anemia",
      "migraine",
      "perimenopause",
      "asthma in pregnancy",
      "metformin",
      "levothyroxine",
      "iron supplements",
      "pelvic ultrasound",
      "a1c",
      "tsh",
      "blood pressure monitoring",
      "question lists",
      "transportation",
      "financial assistance",
      "988",
      "emergency warning signs",
    ]) {
      expect(tags.has(t), t).toBe(true);
    }
  });

  it("getReferenceById finds known ids and returns undefined otherwise", () => {
    expect(getReferenceById("ref-medlineplus-pcos")?.title).toBe("Polycystic Ovary Syndrome");
    expect(getReferenceById("ref-does-not-exist")).toBeUndefined();
  });
});
