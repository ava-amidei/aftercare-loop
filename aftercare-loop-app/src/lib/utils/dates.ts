import type { Language } from "@/lib/types";

/**
 * Date helpers. Date-only strings ("2026-10-14") are treated as LOCAL calendar
 * dates so they never shift a day when formatted in US time zones.
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

export const LOCALE_BY_LANGUAGE: Record<Language, string> = {
  en: "en-US",
  es: "es-US",
};

export function nowIso(): string {
  return new Date().toISOString();
}

export function isDateOnly(value: string): boolean {
  return DATE_ONLY.test(value);
}

/** Parse an ISO date or date-time. Returns null for invalid input. */
export function parseDate(value: string | Date | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const m = DATE_ONLY.exec(value);
  if (m) {
    const [, y, mo, d] = m;
    const date = new Date(Number(y), Number(mo) - 1, Number(d));
    // Reject overflow like 2026-02-31.
    if (date.getMonth() !== Number(mo) - 1 || date.getDate() !== Number(d)) return null;
    return date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isValidIsoDate(value: string | null | undefined): boolean {
  return parseDate(value ?? null) !== null;
}

/** Local calendar date as "YYYY-MM-DD". */
export function toIsoDate(value: Date | string): string {
  const d = parseDate(value);
  if (!d) throw new RangeError(`Invalid date: ${String(value)}`);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(value: Date | string, days: number): Date {
  const d = parseDate(value);
  if (!d) throw new RangeError(`Invalid date: ${String(value)}`);
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

/** "Oct 14, 2026" / "14 oct 2026". Returns "" for invalid input. */
export function formatDate(
  value: string | Date | null | undefined,
  language: Language = "en",
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" },
): string {
  const d = parseDate(value ?? null);
  if (!d) return "";
  return new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language], options).format(d);
}

export function formatDateTime(value: string | Date | null | undefined, language: Language = "en"): string {
  return formatDate(value, language, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Whole calendar days from `now` to `value` (negative = past). */
export function daysUntil(value: string | Date, now: Date = new Date()): number | null {
  const d = parseDate(value);
  if (!d) return null;
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((a - b) / 86_400_000);
}

/** "today", "tomorrow", "in 3 days", "2 days ago" (localized). */
export function formatRelativeDay(value: string | Date, language: Language = "en", now: Date = new Date()): string {
  const diff = daysUntil(value, now);
  if (diff === null) return "";
  const rtf = new Intl.RelativeTimeFormat(LOCALE_BY_LANGUAGE[language], { numeric: "auto" });
  if (Math.abs(diff) < 14) return rtf.format(diff, "day");
  if (Math.abs(diff) < 60) return rtf.format(Math.round(diff / 7), "week");
  return rtf.format(Math.round(diff / 30), "month");
}

/** True when the calendar day is strictly before today. */
export function isPast(value: string | Date, now: Date = new Date()): boolean {
  const diff = daysUntil(value, now);
  return diff !== null && diff < 0;
}

/** Comparator for sorting ISO strings / Dates ascending; invalid dates sort last. */
export function compareDates(a: string | Date | undefined, b: string | Date | undefined): number {
  const da = a === undefined ? null : parseDate(a);
  const db = b === undefined ? null : parseDate(b);
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  return da.getTime() - db.getTime();
}
