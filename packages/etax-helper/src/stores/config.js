import { getValue, setValue } from '../core/userscript';
import { reactive, ref } from 'vue';
import { runtime, fail } from './runtime';
import { CONFIG_KEY, configDefaults, createConfigRepository } from '../core/config';
export const storageWarning = ref('');
export const config = reactive({...configDefaults});
const repository = createConfigRepository({getValue, setValue,
  getLegacy: () => localStorage.getItem(CONFIG_KEY),
  removeLegacy: () => localStorage.removeItem(CONFIG_KEY),
});
function warning(error, saving = false) {
  if (error?.code === 'CONFIG_VERSION_NEWER') return '配置来自更高版本，已停止写入。请升级脚本后重新读取。';
  if (error?.code === 'CONFIG_INVALID') return '配置格式异常，已停止本次写入并保留原数据。';
  return saving ? '设置保存失败，请重试读取配置。' : '设置读取失败，已停止写入。请重试读取原配置。';
}
export const readConfig = () => repository.load();
export function reloadConfig() {
  try {
    const next = readConfig();
    for (const key of Object.keys(config)) if (!(key in next)) delete config[key];
    Object.assign(config, next);
    storageWarning.value = ''; runtime.config = 'ready';
    return true;
  } catch (error) {
    storageWarning.value = warning(error);
    fail('config', 'CONFIG_READ_FAILED');
    return false;
  }
}
export function saveConfig(value) {
  try {
    const next = repository.save(value);
    Object.assign(config, next);
    storageWarning.value = ''; runtime.config = 'ready';
  } catch (error) {
    storageWarning.value = warning(error, true);
    fail('config', 'CONFIG_WRITE_FAILED');
    throw new Error(storageWarning.value);
  }
}
