/**
 * i18n entry point. UI language is store-driven: it is the ACTIVE patient's
 * `profile.language`, so switching to a Spanish-preferring fictional patient
 * switches the UI, and Kat's output uses the same language.
 *
 *   const t = useT();            t("nav.home")
 *   const { t, lang } = useT();  t("dashboard.greeting", { name })
 *   const { language, setLanguage } = useLanguage();
 *   t(lang, key, params)         // pure, from "./core" (re-exported below)
 *
 * Hydration: before the persisted store is rehydrated, language comes from the
 * fixture state, identical on server and client, so there is no mismatch.
 */
import { useCallback } from "react";
import type { Language } from "@/lib/types";
import { useDemoStore } from "@/lib/store/demo-store";
import { DEFAULT_LANGUAGE, getTranslator, isLanguage } from "./core";
import type { Translator } from "./types";

export * from "./core";
export * from "./labels";
export type * from "./types";

/** Current UI language (active patient's preferred language). */
export function useCurrentLanguage(): Language {
  return useDemoStore((s) => {
    const lang = s.patients[s.activePatientId]?.profile.language;
    return isLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  });
}

/** Stable translator for the current language. */
export function useT(): Translator {
  return getTranslator(useCurrentLanguage());
}

/** Language toggle: updates the active patient's profile language. */
export function useLanguage(): { language: Language; setLanguage: (lang: Language) => void } {
  const language = useCurrentLanguage();
  const setLanguage = useCallback((lang: Language) => {
    const { activePatientId, updateProfile } = useDemoStore.getState();
    updateProfile(activePatientId, { language: lang });
  }, []);
  return { language, setLanguage };
}
