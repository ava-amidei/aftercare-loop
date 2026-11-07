/** Small, pure text helpers used across UI and services. */

/** Collapse runs of whitespace to single spaces and trim. */
export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Truncate to `max` characters (including the ellipsis), preferring a word boundary. */
export function truncate(value: string, max: number, ellipsis = "…"): string {
  if (max <= 0) return "";
  if (value.length <= max) return value;
  const room = Math.max(0, max - ellipsis.length);
  const cut = value.slice(0, room);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > room * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.trimEnd()}${ellipsis}`;
}

/** URL/id-safe slug: "What does A1C mean?" → "what-does-a1c-mean". */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function capitalize(value: string): string {
  return value.length ? value[0].toUpperCase() + value.slice(1) : value;
}

/** "Maya Torres" → "MT"; single names → first letter. */
export function initials(name: string, max = 2): string {
  return normalizeWhitespace(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, max)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** "cost_or_insurance" → "Cost or insurance". Display fallback for enum values. */
export function humanizeEnum(value: string): string {
  return capitalize(value.replace(/[_-]+/g, " ").trim());
}

export interface Excerpt {
  before: string;
  match: string;
  after: string;
  /** True when `before` was cut (render a leading ellipsis). */
  truncatedStart: boolean;
  /** True when `after` was cut (render a trailing ellipsis). */
  truncatedEnd: boolean;
}

/**
 * Surrounding context for text[start, end). Offsets are clamped. Context is
 * extended to the nearest word boundary within `radius` characters.
 */
export function excerptAround(text: string, start: number, end: number, radius = 80): Excerpt {
  const s = Math.max(0, Math.min(start, text.length));
  const e = Math.max(s, Math.min(end, text.length));
  let from = Math.max(0, s - radius);
  let to = Math.min(text.length, e + radius);
  if (from > 0) {
    const space = text.indexOf(" ", from);
    if (space !== -1 && space < s) from = space + 1;
  }
  if (to < text.length) {
    const space = text.lastIndexOf(" ", to);
    if (space !== -1 && space > e) to = space;
  }
  return {
    before: text.slice(from, s),
    match: text.slice(s, e),
    after: text.slice(e, to),
    truncatedStart: from > 0,
    truncatedEnd: to < text.length,
  };
}
