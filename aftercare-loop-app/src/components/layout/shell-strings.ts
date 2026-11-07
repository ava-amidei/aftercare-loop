import { isTranslationKey } from "@/lib/i18n/core";
import type { Translator } from "@/lib/i18n/types";
import { PRIMARY_NAV, SECONDARY_NAV } from "./nav-config";

/**
 * UI strings for the shell. AppShell derives them from the i18n dictionary for
 * the current UI language (shellStringsFor) and still accepts `strings`
 * overrides. Keys mirror i18n dictionary keys.
 */
export interface ShellStrings {
  appName: string;
  skipToContent: string;
  primaryNav: string;
  secondaryNav: string;
  /** aria-label of the mobile footer copy of the secondary nav. */
  footerNav: string;
  footerDisclaimer: string;
  demoBanner: string;
  /** Static label shown when no patient switcher is plugged in. */
  patientFallback: string;
  navLabels: Record<string, string>; // keyed by NavItem.key
}

export const SHELL_STRINGS_EN: ShellStrings = {
  appName: "Aftercare Loop",
  skipToContent: "Skip to main content",
  primaryNav: "Main",
  secondaryNav: "More",
  footerNav: "More (footer)",
  footerDisclaimer: "Educational information, not medical advice. Fictional data.",
  demoBanner: "Demonstration using fictional patient data.",
  patientFallback: "Fictional demo patient",
  navLabels: {},
};

/** Shell strings in the translator's language (missing keys fall back to English in t()). */
export function shellStringsFor(t: Translator): ShellStrings {
  const navLabels: Record<string, string> = {};
  for (const item of [...PRIMARY_NAV, ...SECONDARY_NAV]) {
    navLabels[item.key] = isTranslationKey(item.key) ? t(item.key) : item.label;
  }
  return {
    appName: t("common.appName"),
    skipToContent: t("common.skipToContent"),
    primaryNav: t("nav.primaryLabel"),
    secondaryNav: t("nav.secondaryLabel"),
    footerNav: t("nav.footerLabel"),
    footerDisclaimer: t("common.footerDisclaimer"),
    demoBanner: t("common.demoBanner"),
    patientFallback: t("common.patientSwitcher.fallback"),
    navLabels,
  };
}
