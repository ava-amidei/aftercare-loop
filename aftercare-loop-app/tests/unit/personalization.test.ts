/**
 * Personalization (docs/DESIGN.md): accent CSS variables, root font scale,
 * per-patient persistence of `appearance`, and resetDemo().
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PatientProfile, VisitDocument } from "@/lib/types";

// Self-contained fictional fixtures (no dependency on the real patient data).
vi.mock("@/data/patients", () => {
  const mk = (id: string, name: string): PatientProfile => ({
    id,
    displayName: name,
    ageRange: "40–49",
    language: "en",
    explanationLevel: "standard",
    accessibility: [],
    conditions: ["Test concern"],
    medications: [],
    careInstructions: [],
    healthGoals: [],
    barriers: [],
    scenarioSummary: "Fictional test patient",
  });
  const doc = (patientId: string, id: string): VisitDocument => ({
    id,
    patientId,
    title: "Fictional After-Visit Summary",
    text: "Fictional test document text.",
    createdAt: "2026-10-01",
    source: "fixture",
  });
  return {
    DEFAULT_PATIENT_ID: "pt-ap-a",
    patients: [mk("pt-ap-a", "Appearance A"), mk("pt-ap-b", "Appearance B")],
    documentsByPatient: {
      "pt-ap-a": [doc("pt-ap-a", "doc-ap-a")],
      "pt-ap-b": [doc("pt-ap-b", "doc-ap-b")],
    },
  };
});

// Node >= 25 shadows jsdom's localStorage; install an in-memory Storage first.
const data = new Map<string, string>();
const storage: Storage = {
  get length() {
    return data.size;
  },
  clear: () => data.clear(),
  getItem: (k) => (data.has(k) ? data.get(k)! : null),
  key: (i) => [...data.keys()][i] ?? null,
  removeItem: (k) => void data.delete(k),
  setItem: (k, v) => void data.set(k, String(v)),
};
Object.defineProperty(window, "localStorage", { value: storage, configurable: true });
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });

const { useDemoStore, DEMO_STORE_KEY } = await import("@/lib/store/demo-store");
const {
  ACCENT_PRESETS,
  DEFAULT_ACCENT,
  effectiveFontScale,
  fontScaleToCss,
  stepFontScale,
} = await import("@/lib/store/appearance");
const { applyAppearance, applyAccent } = await import("@/components/theme/apply-appearance");
const { contrastRatio, deriveAccentVars, hexToHsl, hslToHex, pickContrastText } = await import(
  "@/components/theme/color"
);

const A = "pt-ap-a";
const B = "pt-ap-b";
const store = () => useDemoStore.getState();
const root = () => document.documentElement;
const cssVar = (name: string) => root().style.getPropertyValue(name);

beforeEach(() => {
  localStorage.clear();
  store().resetDemo();
  root().removeAttribute("style");
  delete root().dataset.fontScale;
  delete root().dataset.accent;
});

describe("accent colour", () => {
  it("applies --color-primary, derived tints/shades and a contrast colour on <html>", () => {
    applyAccent("#8FB996");
    expect(cssVar("--color-primary")).toBe("#8FB996");
    for (const step of ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"]) {
      expect(cssVar(`--color-primary-${step}`)).toMatch(/^#[0-9A-F]{6}$/);
    }
    expect(cssVar("--color-primary-hover")).toMatch(/^#[0-9A-F]{6}$/);
    expect(cssVar("--color-primary-contrast")).toBe("#141414");
    expect(root().dataset.accent).toBe("#8FB996");
    // Tints are lighter and shades darker than the base.
    const l = (name: string) => hexToHsl(cssVar(name)).l;
    expect(l("--color-primary-50")).toBeGreaterThan(l("--color-primary"));
    expect(l("--color-primary-900")).toBeLessThan(l("--color-primary"));
  });

  it("defaults to the brand peach with the design's strong shade", () => {
    applyAppearance(undefined);
    expect(cssVar("--color-primary")).toBe(DEFAULT_ACCENT);
    expect(cssVar("--color-primary-strong")).toBe("#EE6200");
  });

  it("picks a readable contrast colour by luminance for every preset", () => {
    for (const p of ACCENT_PRESETS) {
      const vars = deriveAccentVars(p.hex);
      const text = vars["--color-primary-contrast"];
      expect(text).toBe(pickContrastText(p.hex));
      expect(contrastRatio(p.hex, text)).toBeGreaterThanOrEqual(4.5);
      // Accent-coloured text on white stays AA.
      expect(contrastRatio(vars["--color-primary-ink"], "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    }
    expect(pickContrastText("#1E3A8A")).toBe("#FFFFFF");
  });

  it("round-trips hex through HSL", () => {
    for (const p of ACCENT_PRESETS) expect(hslToHex(hexToHsl(p.hex))).toBe(p.hex);
  });

  it("falls back to the default for an invalid accent", () => {
    applyAppearance({ accent: "red" });
    expect(cssVar("--color-primary")).toBe(DEFAULT_ACCENT);
  });
});

describe("font scale", () => {
  it("sets the root font-size for each explicit step", () => {
    const expected = { sm: "93.75%", md: "106.25%", lg: "118.75%", xl: "137.5%" } as const;
    for (const [scale, pct] of Object.entries(expected)) {
      applyAppearance({ fontScale: scale as keyof typeof expected });
      expect(root().style.fontSize).toBe(pct);
      expect(root().dataset.fontScale).toBe(scale);
      expect(fontScaleToCss(scale as keyof typeof expected)).toBe(pct);
    }
  });

  it("changing fontScale changes the root size; clearing defers to the stylesheet", () => {
    applyAppearance({ fontScale: "sm" });
    const small = root().style.fontSize;
    applyAppearance({ fontScale: "xl" });
    expect(root().style.fontSize).not.toBe(small);
    applyAppearance({});
    expect(root().style.fontSize).toBe("");
    expect(root().dataset.fontScale).toBe("md");
  });

  it("maps larger_text to lg when fontScale is unset; explicit fontScale wins", () => {
    expect(effectiveFontScale(undefined, ["larger_text"])).toBe("lg");
    expect(effectiveFontScale(undefined, [])).toBe("md");
    expect(effectiveFontScale({ fontScale: "sm" }, ["larger_text"])).toBe("sm");
    applyAppearance(undefined, ["larger_text"]);
    expect(root().dataset.fontScale).toBe("lg");
  });

  it("steps and clamps", () => {
    expect(stepFontScale("md", 1)).toBe("lg");
    expect(stepFontScale("xl", 1)).toBe("xl");
    expect(stepFontScale("sm", -1)).toBe("sm");
  });
});

describe("store: per-patient appearance", () => {
  it("stores appearance per patient without leaking", () => {
    store().setAppearance(A, { accent: "#7FB3D5" });
    store().setAppearance(A, { fontScale: "xl" });
    expect(store().patients[A].appearance).toEqual({ accent: "#7FB3D5", fontScale: "xl" });
    expect(store().patients[B].appearance).toBeUndefined();
  });

  it("ignores invalid values and clears keys set to undefined", () => {
    store().setAppearance(A, { accent: "#B8A1D9", fontScale: "lg" });
    store().setAppearance(A, { accent: "not-a-colour", fontScale: "huge" as never });
    expect(store().patients[A].appearance).toEqual({ accent: "#B8A1D9", fontScale: "lg" });
    store().setAppearance(A, { fontScale: undefined });
    expect(store().patients[A].appearance).toEqual({ accent: "#B8A1D9" });
    store().setAppearance(A, { accent: undefined });
    expect(store().patients[A].appearance).toBeUndefined();
  });

  it("persists appearance to localStorage and rehydrates it per patient", async () => {
    store().setAppearance(B, { accent: "#8FB996", fontScale: "sm" });
    const raw = JSON.parse(localStorage.getItem(DEMO_STORE_KEY) ?? "null");
    expect(raw.state.patients[B].appearance).toEqual({ accent: "#8FB996", fontScale: "sm" });
    expect(raw.state.patients[A].appearance).toBeUndefined();

    useDemoStore.setState({ patients: { ...store().patients, [B]: { ...store().patients[B], appearance: undefined } } });
    // Corrupt A's persisted appearance: it must be dropped, not applied.
    raw.state.patients[A].appearance = { accent: "javascript:alert(1)", fontScale: "giant" };
    localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(raw));
    await useDemoStore.persist.rehydrate();
    expect(store().patients[B].appearance).toEqual({ accent: "#8FB996", fontScale: "sm" });
    expect(store().patients[A].appearance).toBeUndefined();
  });

  it("resetDemo restores default appearance for all patients", () => {
    store().setAppearance(A, { accent: "#EE6200", fontScale: "xl" });
    store().setAppearance(B, { fontScale: "sm" });
    store().resetDemo();
    expect(store().patients[A].appearance).toBeUndefined();
    expect(store().patients[B].appearance).toBeUndefined();
    applyAppearance(store().patients[A].appearance);
    expect(cssVar("--color-primary")).toBe(DEFAULT_ACCENT);
    expect(root().style.fontSize).toBe("");
  });
});

describe("components", () => {
  it("ThemeApplier follows the active patient and FontSizeControl steps the scale", async () => {
    const { createElement, Fragment } = await import("react");
    const { act, render, screen, fireEvent } = await import("@testing-library/react");
    const { ThemeApplier } = await import("@/components/theme/ThemeApplier");
    const { FontSizeControl } = await import("@/components/layout/FontSizeControl");
    await useDemoStore.persist.rehydrate();

    store().setAppearance(A, { accent: "#B8A1D9" });
    store().setAppearance(B, { accent: "#7FB3D5", fontScale: "lg" });
    render(createElement(Fragment, null, createElement(ThemeApplier), createElement(FontSizeControl)));
    expect(cssVar("--color-primary")).toBe("#B8A1D9");
    expect(root().style.fontSize).toBe("");

    act(() => store().switchPatient(B));
    expect(cssVar("--color-primary")).toBe("#7FB3D5");
    expect(root().style.fontSize).toBe("118.75%");

    fireEvent.click(screen.getByRole("button", { name: "Increase text size" }));
    expect(store().patients[B].appearance?.fontScale).toBe("xl");
    expect(root().style.fontSize).toBe("137.5%");
    expect(screen.getByRole("button", { name: "Increase text size" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Decrease text size" }));
    expect(store().patients[B].appearance?.fontScale).toBe("lg");
    expect(store().patients[A].appearance?.fontScale).toBeUndefined();
  });
});
