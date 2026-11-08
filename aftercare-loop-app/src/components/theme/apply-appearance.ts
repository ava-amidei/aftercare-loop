/**
 * Pure DOM application of a patient's appearance to <html>. Kept separate
 * from the React component so it is unit-testable and reusable.
 */
import type { AccessibilityPreference, AppearancePrefs } from "@/lib/types";
import {
  effectiveAccent,
  effectiveFontScale,
  fontScaleToCss,
} from "@/lib/store/appearance";
import { deriveAccentVars } from "./color";

const rootEl = (): HTMLElement | undefined =>
  typeof document === "undefined" ? undefined : document.documentElement;

/** Sets --color-primary and its derived tints/shades/contrast on `root`. */
export function applyAccent(accent: string, root: HTMLElement | undefined = rootEl()): void {
  if (!root) return;
  for (const [name, value] of Object.entries(deriveAccentVars(accent))) {
    root.style.setProperty(name, value);
  }
  root.dataset.accent = accent.toUpperCase();
}

/**
 * Sets the root font size. With an explicit fontScale an inline font-size is
 * written (percent of the browser default, so the browser's own text-size
 * setting still applies). With no explicit fontScale the inline size is
 * removed and globals.css decides: its default (~17px) or, for the
 * `larger_text` accessibility pref, html[data-text-size="large"] (~19px = lg).
 * `data-font-scale` always reports the effective step.
 */
export function applyFontScale(
  appearance: AppearancePrefs | undefined,
  accessibility: readonly AccessibilityPreference[] = [],
  root: HTMLElement | undefined = rootEl(),
): void {
  if (!root) return;
  const scale = effectiveFontScale(appearance, accessibility);
  if (appearance?.fontScale) root.style.setProperty("font-size", fontScaleToCss(scale));
  else root.style.removeProperty("font-size");
  root.dataset.fontScale = scale;
}

export function applyAppearance(
  appearance: AppearancePrefs | undefined,
  accessibility: readonly AccessibilityPreference[] = [],
  root: HTMLElement | undefined = rootEl(),
): void {
  applyAccent(effectiveAccent(appearance), root);
  applyFontScale(appearance, accessibility, root);
}
