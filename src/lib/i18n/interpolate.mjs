/** Replace `{key}` placeholders in dictionary strings. */
export function interpolate(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in values ? String(values[key]) : `{${key}}`,
  );
}
