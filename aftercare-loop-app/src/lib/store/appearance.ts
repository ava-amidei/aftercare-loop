/**
 * Appearance presets and pure helpers (docs/DESIGN.md "Personalization &
 * accessibility"). No React, no DOM: safe for the store, server code and tests.
 */
import type { AccessibilityPreference, AppearancePrefs, FontScale } from "@/lib/types";

export const DEFAULT_ACCENT = "#FBA17E";

export type AccentPresetId =
  | "peach"
  | "sand"
  | "amber"
  | "ember"
  | "sage"
  | "sky"
  | "lavender";

export interface AccentPreset {
  id: AccentPresetId;
  hex: string;
}

/** Order = display order in the Profile swatch picker. First is the default. */
export const ACCENT_PRESETS: readonly AccentPreset[] = [
  { id: "peach", hex: "#FBA17E" },
  { id: "sand", hex: "#F7D794" },
  { id: "amber", hex: "#FF9A00" },
  { id: "ember", hex: "#EE6200" },
  { id: "sage", hex: "#8FB996" },
  { id: "sky", hex: "#7FB3D5" },
  { id: "lavender", hex: "#B8A1D9" },
];

export const FONT_SCALES: readonly FontScale[] = ["sm", "md", "lg", "xl"];
export const DEFAULT_FONT_SCALE: FontScale = "md";

/** Nominal root size in px (at the 16px browser default). */
export const FONT_SCALE_PX: Record<FontScale, number> = { sm: 15, md: 17, lg: 19, xl: 22 };

/**
 * Root font-size as a percentage of the browser default, so the user's own
 * browser text-size setting still scales the app (15/16, 17/16, …).
 */
export function fontScaleToCss(scale: FontScale): string {
  return `${(FONT_SCALE_PX[scale] / 16) * 100}%`;
}

const HEX_RE = /^#[0-9a-f]{6}$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_RE.test(value);
}

export function isFontScale(value: unknown): value is FontScale {
  return typeof value === "string" && (FONT_SCALES as readonly string[]).includes(value);
}

/** Canonical upper-case "#RRGGBB" or undefined if invalid. */
export function normalizeAccent(value: unknown): string | undefined {
  return isHexColor(value) ? value.toUpperCase() : undefined;
}

/** Drops invalid / undefined fields; returns undefined when nothing remains. */
export function sanitizeAppearance(value: unknown): AppearancePrefs | undefined {
  if (!value || typeof value !== "object") return undefined;
  const v = value as Record<string, unknown>;
  const out: AppearancePrefs = {};
  const accent = normalizeAccent(v.accent);
  if (accent) out.accent = accent;
  if (isFontScale(v.fontScale)) out.fontScale = v.fontScale;
  return out.accent || out.fontScale ? out : undefined;
}

/**
 * Merges a patch into the current prefs. A key present with value `undefined`
 * clears that field; invalid values are ignored (current value kept).
 */
export function mergeAppearance(
  current: AppearancePrefs | undefined,
  patch: Partial<AppearancePrefs>,
): AppearancePrefs | undefined {
  const next: Record<string, unknown> = { ...(current ?? {}) };
  if ("accent" in patch) {
    if (patch.accent === undefined) delete next.accent;
    else if (isHexColor(patch.accent)) next.accent = patch.accent;
  }
  if ("fontScale" in patch) {
    if (patch.fontScale === undefined) delete next.fontScale;
    else if (isFontScale(patch.fontScale)) next.fontScale = patch.fontScale;
  }
  return sanitizeAppearance(next);
}

/** Accent actually applied (brand default when unset/invalid). */
export function effectiveAccent(appearance: AppearancePrefs | undefined): string {
  return normalizeAccent(appearance?.accent) ?? DEFAULT_ACCENT;
}

/** Explicit fontScale wins; otherwise larger_text → "lg", else "md". */
export function effectiveFontScale(
  appearance: AppearancePrefs | undefined,
  accessibility: readonly AccessibilityPreference[] = [],
): FontScale {
  if (isFontScale(appearance?.fontScale)) return appearance.fontScale;
  return accessibility.includes("larger_text") ? "lg" : DEFAULT_FONT_SCALE;
}

/** Next step up/down, clamped to the ends of FONT_SCALES. */
export function stepFontScale(scale: FontScale, delta: 1 | -1): FontScale {
  const i = FONT_SCALES.indexOf(scale);
  const j = Math.min(FONT_SCALES.length - 1, Math.max(0, (i < 0 ? 1 : i) + delta));
  return FONT_SCALES[j];
}
