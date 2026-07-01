import { en, type Dictionary } from "./dictionaries/en";
import { zh } from "./dictionaries/zh";
import {
  DEFAULT_LOCALE as DEFAULT_LOCALE_VALUE,
  resolveLocale as resolveLocaleRuntime,
  SUPPORTED_LOCALES as SUPPORTED_LOCALES_VALUE,
} from "./locale.mjs";

export const SUPPORTED_LOCALES = SUPPORTED_LOCALES_VALUE;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = DEFAULT_LOCALE_VALUE;

const dictionaries: Record<Locale, Dictionary> = { en, zh };

export function isLocale(value: string | null | undefined): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

export function resolveLocale(input: string | null | undefined): Locale {
  return resolveLocaleRuntime(input);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? en;
}

export {
  getAnalyzeProgressPercent,
  getAnalyzeStepLabels,
  getFlowStepLabels,
  resolveAnalyzeStepIndex,
  translateAnalyzeStep,
} from "./translate-analyze-step";
export { interpolate } from "./interpolate";
export { localizedHref } from "./localized-href";
export type {
  Dictionary,
  AccountDictionary,
  DesignSystemDictionary,
  HeaderDictionary,
  HeroDictionary,
  NotFoundDictionary,
  ShareDictionary,
  UploadFlowDictionary,
} from "./dictionaries/en";
