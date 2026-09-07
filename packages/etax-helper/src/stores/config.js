import { getValue, setValue } from '../core/userscript';
import { reactive, ref } from 'vue';
import { runtime, fail } from './runtime';
const key = 'etax_helper_config';
const defaults = { apiKey: '', newTab: true, tab: '', width: 720 };
export const storageWarning = ref('');
export const config = reactive({...defaults});
let readable = false;
export function readConfig() {
  let value = getValue(key, null);
  const legacy = value == null;
  if (value == null) {
    // Block writes when legacy storage cannot be read: never silently replace it.
    value = JSON.parse(localStorage.getItem(key) || 'null');
  }
  if (value != null && (typeof value !== 'object' || Array.isArray(value))) throw new Error('invalid config');
  if (legacy && value != null) setValue(key, value);
  return {...defaults, ...value};
}
export function reloadConfig() {
  try {
    const next = readConfig();
    Object.assign(config, next);
    readable = true; storageWarning.value = ''; runtime.config = 'ready';
    return true;
  } catch {
    readable = false;
    storageWarning.value = '设置读取失败，已停止写入。请重试读取原配置。';
    fail('config', 'CONFIG_READ_FAILED');
    return false;
  }
}
export function saveConfig(value) {
  if (!readable) throw new Error('请先成功读取原配置');
  const next = { ...config, ...value };
  try { setValue(key, JSON.parse(JSON.stringify(next))); }
  catch {
    storageWarning.value = '设置保存失败，原配置未被替换。';
    fail('config', 'CONFIG_WRITE_FAILED');
    throw new Error('设置保存失败');
  }
  Object.assign(config, next);
  storageWarning.value = ''; runtime.config = 'ready';
  try { localStorage.removeItem(key); } catch { /* Keep legacy data if cleanup is blocked. */ }
}
