import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { act, render } from "@testing-library/react";
import { ensureDemoStoreHydrated, useDemoStore } from "@/lib/store";
import { applyAccessibilityPrefs } from "./profile-draft";
import { AccessibilityPrefsSync, useApplyAccessibilityPrefs } from "./use-accessibility-prefs";

const html = () => document.documentElement;
const store = () => useDemoStore.getState();

/** First fixture patient whose saved prefs include `pref` (fictional data). */
function patientWith(pref: string): string {
  const hit = Object.values(store().patients).find((p) => p.profile.accessibility.includes(pref as never));
  if (!hit) throw new Error(`no fixture patient with ${pref}`);
  return hit.profile.id;
}
function patientWithout(): string {
  const hit = Object.values(store().patients).find((p) => p.profile.accessibility.length === 0);
  if (!hit) throw new Error("no fixture patient without prefs");
  return hit.profile.id;
}

// The Sync triggers the one-per-page rehydrate; finish it up front so it can't
// overwrite the patient a test switched to.
beforeAll(async () => {
  ensureDemoStoreHydrated();
  await useDemoStore.persist.rehydrate();
});

beforeEach(() => {
  act(() => store().resetDemo());
  applyAccessibilityPrefs([]);
});
afterEach(() => applyAccessibilityPrefs([]));

describe("AccessibilityPrefsSync", () => {
  it("applies the active patient's saved prefs on mount and follows patient switches", () => {
    act(() => store().switchPatient(patientWith("larger_text")));
    render(<AccessibilityPrefsSync />);
    expect(html()).toHaveAttribute("data-text-size", "large");

    act(() => store().switchPatient(patientWith("high_contrast")));
    expect(html()).toHaveAttribute("data-contrast", "high");

    act(() => store().switchPatient(patientWithout()));
    expect(html()).not.toHaveAttribute("data-text-size");
    expect(html()).not.toHaveAttribute("data-contrast");
  });

  it("re-applies when the saved prefs are edited", () => {
    const id = patientWithout();
    act(() => store().switchPatient(id));
    render(<AccessibilityPrefsSync />);
    expect(html()).not.toHaveAttribute("data-contrast");
    act(() => store().updateProfile(id, { accessibility: ["high_contrast"] }));
    expect(html()).toHaveAttribute("data-contrast", "high");
  });

  it("lets a later page-level preview (e.g. ProfileEditor) win in the same commit", () => {
    act(() => store().switchPatient(patientWithout()));
    function Preview() {
      useApplyAccessibilityPrefs(["larger_text"]);
      return null;
    }
    render(
      <>
        <AccessibilityPrefsSync />
        <main>
          <Preview />
        </main>
      </>,
    );
    expect(html()).toHaveAttribute("data-text-size", "large");
  });
});
