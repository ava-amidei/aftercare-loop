/**
 * Tiny colour helpers for the personalised accent (no dependencies).
 * hex ⇄ RGB ⇄ HSL, WCAG relative luminance / contrast, and the derived
 * --color-primary-* CSS variables applied by <ThemeApplier/>.
 */
import { DEFAULT_ACCENT, normalizeAccent } from "@/lib/store/appearance";

export interface Rgb { r: number; g: number; b: number }
export interface Hsl { h: number; s: number; l: number }

/** Text colours considered for --color-primary-contrast (DESIGN gray-0 / gray-100). */
export const CONTRAST_LIGHT = "#FFFFFF";
export const CONTRAST_DARK = "#141414";

export function hexToRgb(hex: string): Rgb {
  const h = (normalizeAccent(hex) ?? DEFAULT_ACCENT).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const c = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h * 60, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const sn = Math.min(100, Math.max(0, s)) / 100;
  const ln = Math.min(100, Math.max(0, l)) / 100;
  const k = (n: number) => (n + (((h % 360) + 360) % 360) / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 };
}

export const hexToHsl = (hex: string): Hsl => rgbToHsl(hexToRgb(hex));
export const hslToHex = (hsl: Hsl): string => rgbToHex(hslToRgb(hsl));

/** Same hue/saturation, lightness set to `l` (0–100). */
export function withLightness(hex: string, l: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex({ ...hsl, l });
}

/** WCAG 2.x relative luminance (0–1). */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a), lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** White or near-black, whichever contrasts more with `bg`. */
export function pickContrastText(bg: string): string {
  return contrastRatio(bg, CONTRAST_LIGHT) >= contrastRatio(bg, CONTRAST_DARK)
    ? CONTRAST_LIGHT
    : CONTRAST_DARK;
}

/**
 * Darkens `hex` (same hue) until it reaches `min` contrast against `on`.
 * Used for accent-coloured TEXT on light surfaces (≥ 4.5:1).
 */
export function darkenToContrast(hex: string, on = CONTRAST_LIGHT, min = 4.5): string {
  const hsl = hexToHsl(hex);
  let out = hslToHex(hsl);
  for (let l = hsl.l; l >= 0 && contrastRatio(out, on) < min; l -= 1) {
    out = hslToHex({ ...hsl, l });
  }
  return out;
}

/** Lightness targets for the derived tint/shade scale. */
const SCALE_LIGHTNESS: Record<string, number> = {
  "50": 97, "100": 93, "200": 86, "300": 77, "400": 68,
  "600": 46, "700": 37, "800": 28, "900": 20,
};

/** Design-provided strong shade for the default accent (docs/DESIGN.md). */
const DEFAULT_STRONG = "#EE6200";

/**
 * All CSS variables derived from one accent. Keys are full custom-property
 * names. --color-primary-500 is the accent itself.
 */
export function deriveAccentVars(accent: string): Record<string, string> {
  const base = normalizeAccent(accent) ?? DEFAULT_ACCENT;
  const hsl = hexToHsl(base);
  const vars: Record<string, string> = { "--color-primary": base, "--color-primary-500": base };
  for (const [step, l] of Object.entries(SCALE_LIGHTNESS)) {
    // Never let a "lighter" tint end up darker than the base (or vice versa).
    const target = Number(step) < 500 ? Math.max(l, hsl.l) : Math.min(l, hsl.l);
    vars[`--color-primary-${step}`] = hslToHex({ ...hsl, l: target });
  }
  const strong =
    base === DEFAULT_ACCENT ? DEFAULT_STRONG : hslToHex({ ...hsl, l: Math.max(0, hsl.l - 14) });
  vars["--color-primary-soft"] = vars["--color-primary-100"];
  vars["--color-primary-hover"] = hslToHex({ ...hsl, l: Math.max(0, hsl.l - 7) });
  vars["--color-primary-strong"] = strong;
  vars["--color-primary-ring"] = darkenToContrast(base, CONTRAST_LIGHT, 3);
  vars["--color-primary-ink"] = darkenToContrast(base, CONTRAST_LIGHT, 4.5);
  vars["--color-primary-contrast"] = pickContrastText(base);
  vars["--color-primary-strong-contrast"] = pickContrastText(strong);
  return vars;
}

/** Custom properties managed by applyAccent (for cleanup/tests). */
export const ACCENT_VAR_NAMES: readonly string[] = Object.keys(deriveAccentVars(DEFAULT_ACCENT));
