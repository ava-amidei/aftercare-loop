/**
 * Pure translation core (no React, no store) — safe for server code and tests.
 */
import type { Language } from "@/lib/types";
import { en } from "./en";
import { es } from "./es";
import type {
  Dictionary,
  PartialDictionary,
  TranslateFn,
  TranslationKey,
  TranslationParams,
  Translator,
} from "./types";

export { en, es };

export const DEFAULT_LANGUAGE: Language = "en";
export const SUPPORTED_LANGUAGES: readonly Language[] = ["en", "es"];

export const dictionaries: { en: Dictionary; es: PartialDictionary } = { en, es };

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function isTranslationKey(key: string): key is TranslationKey {
  return Object.prototype.hasOwnProperty.call(en, key);
}

/** Replaces `{name}` placeholders; unknown placeholders are left as-is. */
export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  );
}

/**
 * Translate `key` into `lang`. Falls back to English when the Spanish entry is
 * missing or empty, and to the key itself if the key is unknown at runtime.
 */
export function t(lang: Language, key: TranslationKey, params?: TranslationParams): string {
  const localized = lang === "en" ? undefined : dictionaries[lang]?.[key];
  const template = localized || (en as Dictionary)[key] || key;
  return interpolate(template, params);
}

const translatorCache = new Map<Language, Translator>();

/** Stable (cached) translator per language. Callable and destructurable. */
export function getTranslator(lang: Language): Translator {
  const safeLang = isLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  let tr = translatorCache.get(safeLang);
  if (!tr) {
    const fn: TranslateFn = (key, params) => t(safeLang, key, params);
    tr = Object.assign(fn, { t: fn, lang: safeLang, language: safeLang });
    translatorCache.set(safeLang, tr);
  }
  return tr;
}

/** Keys present in English but missing in `lang` (for coverage checks). */
export function missingKeys(lang: Language): TranslationKey[] {
  const dict = dictionaries[lang] as PartialDictionary;
  return (Object.keys(en) as TranslationKey[]).filter((k) => !dict[k]);
}
