"use client";

import { useEffect } from "react";
import { ensureDemoStoreHydrated, useDemoStore } from "@/lib/store";
import type { AccessibilityPreference } from "@/lib/types";
import { applyAppearance } from "./apply-appearance";

const NONE: AccessibilityPreference[] = [];

/**
 * Applies the ACTIVE fictional patient's saved appearance (accent colour CSS
 * variables + root font size) to <html>. Re-runs on patient switch, edits and
 * resetDemo(). Mounted once in the root layout. Renders nothing.
 */
export function ThemeApplier(): null {
  const appearance = useDemoStore((s) => s.patients[s.activePatientId]?.appearance);
  const accessibility = useDemoStore(
    (s) => s.patients[s.activePatientId]?.profile.accessibility ?? NONE,
  );
  const a11yKey = [...accessibility].sort().join("|");
  const accent = appearance?.accent;
  const fontScale = appearance?.fontScale;

  useEffect(() => {
    ensureDemoStoreHydrated();
  }, []);

  useEffect(() => {
    applyAppearance(
      { accent, fontScale },
      a11yKey ? (a11yKey.split("|") as AccessibilityPreference[]) : NONE,
    );
  }, [accent, fontScale, a11yKey]);

  return null;
}
