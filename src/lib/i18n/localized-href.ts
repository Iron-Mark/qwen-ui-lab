import { localizedHref as localizedHrefRuntime } from "./localized-href.mjs";

export function localizedHref(path: string, locale: string): string {
  return localizedHrefRuntime(path, locale);
}
