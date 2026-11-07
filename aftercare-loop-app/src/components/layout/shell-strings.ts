/**
 * English UI strings for the shell. AppShell accepts `strings` overrides so a
 * client wrapper using useT() from "@/lib/i18n" can pass translations.
 * Keys mirror i18n dictionary keys.
 */
export interface ShellStrings {
  appName: string;
  skipToContent: string;
  primaryNav: string;
  secondaryNav: string;
  footerDisclaimer: string;
  demoBanner: string;
  navLabels: Record<string, string>; // keyed by NavItem.key
}

export const SHELL_STRINGS_EN: ShellStrings = {
  appName: "Aftercare Loop",
  skipToContent: "Skip to main content",
  primaryNav: "Main",
  secondaryNav: "More",
  footerDisclaimer: "Educational information, not medical advice. Fictional data.",
  demoBanner: "Demonstration using fictional patient data.",
  navLabels: {},
};
