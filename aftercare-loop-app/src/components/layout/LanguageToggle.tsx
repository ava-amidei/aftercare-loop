"use client";

import type { Language } from "@/lib/types";
import { SUPPORTED_LANGUAGES, languageNameKey, useLanguage, useT } from "@/lib/i18n";
import { useHasHydrated } from "@/lib/store/hydration";
import { cn } from "@/lib/utils/cn";

const SHORT: Record<Language, string> = { en: "EN", es: "ES" };

/**
 * EN/ES segmented toggle. Updates the ACTIVE patient's `profile.language`
 * (the UI and Kat both follow it), so it persists per fictional patient.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const t = useT();
  const hydrated = useHasHydrated();
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t("dashboard.language.group")}
      className={cn("inline-flex rounded-full bg-gray-5 p-0.5", className)}
    >
      {SUPPORTED_LANGUAGES.map((lang) => {
        const active = lang === language;
        return (
          <button
            key={lang}
            type="button"
            lang={lang}
            aria-pressed={active}
            aria-label={t(languageNameKey(lang))}
            disabled={!hydrated}
            onClick={() => !active && setLanguage(lang)}
            className={cn(
              "min-h-10 min-w-11 rounded-full px-2.5 text-sm font-bold transition-colors",
              "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary-700",
              "disabled:cursor-wait disabled:opacity-70",
              active ? "bg-primary text-primary-contrast" : "text-gray-70 hover:bg-gray-10 hover:text-gray-90",
            )}
          >
            {SHORT[lang]}
          </button>
        );
      })}
    </div>
  );
}
