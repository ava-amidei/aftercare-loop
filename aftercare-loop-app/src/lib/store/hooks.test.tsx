import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PatientProfile } from "@/lib/types";

vi.mock("@/data/patients", () => {
  const mk = (id: string, language: "en" | "es"): PatientProfile => ({
    id,
    displayName: id,
    ageRange: "30–39",
    language,
    explanationLevel: "simple",
    accessibility: [],
    conditions: [],
    medications: [],
    careInstructions: [],
    healthGoals: [],
    barriers: [],
    scenarioSummary: "Fictional test patient",
  });
  return {
    DEFAULT_PATIENT_ID: "pt-en",
    patients: [mk("pt-en", "en"), mk("pt-es", "es")],
    documentsByPatient: {},
  };
});

const { useDemoStore } = await import("./demo-store");
const { useHasHydrated } = await import("./hydration");
const { useActivePatient, useActiveDocument, usePatientProfiles } = await import("./selectors");
const { useT, useLanguage } = await import("@/lib/i18n");

describe("store hooks", () => {
  it("useHasHydrated flips to true after mount-triggered rehydration", async () => {
    const { result } = renderHook(() => useHasHydrated());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("useT follows the active patient's language; useLanguage updates it", () => {
    const { result } = renderHook(() => ({ t: useT(), lang: useLanguage(), p: useActivePatient() }));
    expect(result.current.t("nav.home")).toBe("Home");
    act(() => useDemoStore.getState().switchPatient("pt-es"));
    expect(result.current.p?.id).toBe("pt-es");
    expect(result.current.t("nav.home")).toBe("Inicio");
    act(() => result.current.lang.setLanguage("en"));
    expect(result.current.lang.language).toBe("en");
    expect(useDemoStore.getState().patients["pt-es"].profile.language).toBe("en");
    act(() => useDemoStore.getState().resetDemo());
    expect(result.current.t("nav.home")).toBe("Home");
  });

  it("list/document selectors are stable across renders", () => {
    const { result, rerender } = renderHook(() => ({
      list: usePatientProfiles(),
      doc: useActiveDocument(),
    }));
    const first = result.current.list;
    rerender();
    expect(result.current.list).toBe(first);
    expect(first.map((p) => p.id)).toEqual(["pt-en", "pt-es"]);
    expect(result.current.doc).toBeUndefined();
  });
});
