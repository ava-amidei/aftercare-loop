import type { Language } from "@/lib/types";
import type { en } from "./en";

/** Every feature module's keys must be prefixed with its namespace, e.g. "nav.home". */
export type Namespaced<P extends string> = Record<`${P}.${string}`, string>;

/** A translation of one English feature module: same keys, all optional (falls back to en). */
export type FeatureTranslation<T> = { [K in keyof T]?: string };

/** Union of every UI string key. Source of truth = the merged English dictionary. */
export type TranslationKey = keyof typeof en;

export type Dictionary = Record<TranslationKey, string>;
export type PartialDictionary = Partial<Dictionary>;

/** Values substituted into `{name}` placeholders. */
export type TranslationParams = Record<string, string | number>;

export type TranslateFn = (key: TranslationKey, params?: TranslationParams) => string;

/** Returned by useT(): callable directly (`t("nav.home")`) or destructured (`const { t } = useT()`). */
export type Translator = TranslateFn & {
  t: TranslateFn;
  lang: Language;
  language: Language;
};
