import { describe, expect, it } from "vitest";
import {
  addDays,
  compareDates,
  daysUntil,
  formatDate,
  formatRelativeDay,
  isPast,
  isValidIsoDate,
  parseDate,
  toIsoDate,
} from "./dates";

describe("dates", () => {
  it("parses date-only strings as local calendar dates (no day shift)", () => {
    const d = parseDate("2026-10-14")!;
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(14);
    expect(toIsoDate("2026-10-14")).toBe("2026-10-14");
  });

  it("rejects invalid dates", () => {
    expect(parseDate("2026-02-31")).toBeNull();
    expect(parseDate("not a date")).toBeNull();
    expect(isValidIsoDate(undefined)).toBe(false);
    expect(isValidIsoDate("2026-11-07T10:00:00Z")).toBe(true);
    expect(formatDate("nope")).toBe("");
  });

  it("formats in English and Spanish", () => {
    expect(formatDate("2026-10-14", "en")).toBe("Oct 14, 2026");
    expect(formatDate("2026-10-14", "es")).toMatch(/14.*oct.*2026/i);
  });

  it("computes calendar-day differences", () => {
    const now = new Date(2026, 10, 7, 23, 30);
    expect(daysUntil("2026-11-08", now)).toBe(1);
    expect(daysUntil("2026-11-05", now)).toBe(-2);
    expect(isPast("2026-11-06", now)).toBe(true);
    expect(isPast("2026-11-07", now)).toBe(false);
    expect(formatRelativeDay("2026-11-08", "en", now)).toBe("tomorrow");
    expect(formatRelativeDay("2026-11-07", "en", now)).toBe("today");
    expect(toIsoDate(addDays("2026-12-31", 1))).toBe("2027-01-01");
  });

  it("sorts with invalid dates last", () => {
    const list = ["2026-12-01", "bad", "2026-01-01"].sort(compareDates);
    expect(list).toEqual(["2026-01-01", "2026-12-01", "bad"]);
  });
});
