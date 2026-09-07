import { getValue, setValue } from '../core/userscript';
import { reactive, ref } from 'vue';
const key = 'etax_helper_config';
const defaults = { apiKey: '', newTab: true, tab: '', width: 720 };
export const storageWarning = ref('');
export function readConfig() {
  let value, readable = false;
  try { value = getValue(key, null); readable = true; }
  catch (error) { storageWarning.value = error.message; }
  if (!value && readable) {
    try { value = JSON.parse(localStorage.getItem(key) || 'null'); } catch { /* Invalid legacy settings use defaults. */ }
    if (value && typeof value === 'object') {
      try { setValue(key, value); }
      catch (error) { storageWarning.value = error.message; }
    }
  }
  return { ...defaults, ...(value && typeof value === 'object' ? value : {}) };
}
export const config = reactive(readConfig());
export function saveConfig(value) {
  if (storageWarning.value) throw new Error(storageWarning.value);
  const next = { ...config, ...value };
  setValue(key, JSON.parse(JSON.stringify(next)));
  Object.assign(config, next);
  storageWarning.value = '';
  // Remove legacy API keys only after successful migration/save.
  try { localStorage.removeItem(key); } catch { /* Storage may be blocked by the page. */ }
}
