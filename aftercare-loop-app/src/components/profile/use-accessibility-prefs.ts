"use client";

import { useEffect } from "react";
import { ensureDemoStoreHydrated, useDemoStore } from "@/lib/store";
import type { AccessibilityPreference } from "@/lib/types";
import { applyAccessibilityPrefs } from "./profile-draft";

const NONE: AccessibilityPreference[] = [];

/** Applies the given preferences to <html> whenever they change. */
export function useApplyAccessibilityPrefs(prefs: readonly AccessibilityPreference[]): void {
  const key = [...prefs].sort().join("|");
  useEffect(() => {
    applyAccessibilityPrefs(key ? (key.split("|") as AccessibilityPreference[]) : NONE);
  }, [key]);
}

/** Saved preferences of the active fictional patient. */
export function useSavedAccessibilityPrefs(): AccessibilityPreference[] {
  return useDemoStore((s) => s.patients[s.activePatientId]?.profile.accessibility ?? NONE);
}

/**
 * Keeps <html> in sync with the ACTIVE patient's SAVED accessibility
 * preferences. Mounted once app-wide in AppShell's ShellFrame so
 * prefs persist across pages and patient switches. Renders nothing.
 */
export function AccessibilityPrefsSync(): null {
  // Make sure persisted prefs load even on pages with no other store reader.
  useEffect(() => {
    ensureDemoStoreHydrated();
  }, []);
  useApplyAccessibilityPrefs(useSavedAccessibilityPrefs());
  return null;
}
