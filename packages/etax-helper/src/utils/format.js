export function format(value) {
  if (typeof value !== 'string') return JSON.stringify(value, null, 2) ?? '';
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
}
export function redact(text) {
  return String(text).replace(/("[^"\n]*(?:token|password|cookie|api[-_]?key|authorization)[^"\n]*"\s*:\s*")[^"]*/gi, '$1***')
    .replace(/((?:token|password|cookie|api[-_]?key|authorization)[\w-]*=)[^&\s;]*/gi, '$1***');
}
