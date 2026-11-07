import { describe, expect, it, vi } from "vitest";

// Simulate a partial Spanish dictionary (as when a feature agent adds an
// English key before its translation lands).
vi.mock("./es", () => ({ es: { "nav.home": "Inicio", "nav.plan": "" } }));

const { t, missingKeys } = await import("./core");

describe("t() fallback", () => {
  it("falls back to English for missing or empty Spanish keys", () => {
    expect(t("es", "nav.home")).toBe("Inicio");
    expect(t("es", "nav.understand")).toBe("Understand");
    expect(t("es", "nav.plan")).toBe("Plan");
    expect(t("es", "dashboard.greeting", { name: "Ana" })).toBe("Hi, Ana");
  });

  it("reports missing keys", () => {
    const missing = missingKeys("es");
    expect(missing).toContain("nav.understand");
    expect(missing).not.toContain("nav.home");
  });
});
