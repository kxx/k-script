import { GM_getValue, GM_setValue } from '$';
import { reactive } from 'vue';
const key = 'etax_helper_config';
const defaults = { apiKey: '', newTab: true, tab: '', width: 720 };
export function readConfig() {
  let value = GM_getValue(key, null);
  if (!value) {
    try { value = JSON.parse(localStorage.getItem(key) || 'null'); } catch { /* Invalid legacy settings use defaults. */ }
    if (value && typeof value === 'object') GM_setValue(key, value);
  }
  return { ...defaults, ...(value && typeof value === 'object' ? value : {}) };
}
export const config = reactive(readConfig());
export function saveConfig(value) {
  const next = { ...config, ...value };
  GM_setValue(key, JSON.parse(JSON.stringify(next)));
  Object.assign(config, next);
  // Remove legacy API keys only after successful migration/save.
  try { localStorage.removeItem(key); } catch { /* Storage may be blocked by the page. */ }
}
