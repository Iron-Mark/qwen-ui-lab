"use client";

import { useSearchParams } from "next/navigation";
import { en, type Dictionary } from "./dictionaries/en";
import { zh } from "./dictionaries/zh";
import { resolveLocale, SUPPORTED_LOCALES } from "./locale.mjs";

export type Locale = (typeof SUPPORTED_LOCALES)[number];

function getDictionary(locale: Locale): Dictionary {
  return locale === "zh" ? zh : en;
}

export function useLocale(): { locale: Locale; dict: Dictionary } {
  const searchParams = useSearchParams();
  const locale = resolveLocale(searchParams.get("lang")) as Locale;
  const dict = getDictionary(locale);
  return { locale, dict };
}
