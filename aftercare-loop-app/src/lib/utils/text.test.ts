import { describe, expect, it } from "vitest";
import { capitalize, excerptAround, humanizeEnum, initials, normalizeWhitespace, pluralize, slugify, truncate } from "./text";

describe("text", () => {
  it("normalizes whitespace", () => {
    expect(normalizeWhitespace("  a \n\t b  ")).toBe("a b");
  });

  it("truncates at word boundaries within the limit", () => {
    const out = truncate("Schedule a follow-up visit in two weeks", 20);
    expect(out.length).toBeLessThanOrEqual(20);
    expect(out.endsWith("…")).toBe(true);
    expect(truncate("short", 20)).toBe("short");
    expect(truncate("abc", 0)).toBe("");
  });

  it("slugifies including accents", () => {
    expect(slugify("What does A1C mean?")).toBe("what-does-a1c-mean");
    expect(slugify("¿Qué significa?")).toBe("que-significa");
  });

  it("misc helpers", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(initials("Maya  Rivera Torres")).toBe("MR");
    expect(pluralize(1, "task")).toBe("1 task");
    expect(pluralize(3, "task")).toBe("3 tasks");
    expect(humanizeEnum("cost_or_insurance")).toBe("Cost or insurance");
  });

  it("excerptAround keeps the exact match and context", () => {
    const text = "Intro words here. Take metformin 500 mg with dinner daily. More words follow after that.";
    const quote = "Take metformin 500 mg with dinner daily.";
    const start = text.indexOf(quote);
    const ex = excerptAround(text, start, start + quote.length, 10);
    expect(ex.match).toBe(quote);
    expect(ex.before + ex.match + ex.after).toBe(text.slice(start - ex.before.length, start + quote.length + ex.after.length));
    expect(ex.truncatedStart).toBe(true);
    expect(ex.truncatedEnd).toBe(true);
    const full = excerptAround(text, start, start + quote.length, 500);
    expect(full.truncatedStart).toBe(false);
    expect(full.before + full.match + full.after).toBe(text);
  });

  it("excerptAround clamps out-of-range offsets", () => {
    const ex = excerptAround("abc", -5, 99, 2);
    expect(ex.match).toBe("abc");
  });
});
