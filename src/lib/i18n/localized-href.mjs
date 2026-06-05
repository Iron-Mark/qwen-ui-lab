/** Append `?lang=zh` when locale is not English. */
export function localizedHref(path, locale) {
  if (locale === "en") return path;
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", locale);
  const next = params.toString();
  return next ? `${base}?${next}` : path;
}
