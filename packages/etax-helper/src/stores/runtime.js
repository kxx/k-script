import { reactive, computed } from 'vue';
// Only fixed reason codes are stored. Raw errors may contain credentials or URLs.
export const runtime = reactive({ui: 'pending', config: 'pending', xhr: 'pending', fetch: 'pending', lastError: null});
export function fail(module, reason) { runtime[module] = 'failed'; runtime.lastError = {module, reason}; }
export const captureLabel = computed(() => {
  const states = [runtime.xhr, runtime.fetch];
  if (states.every(value => value === 'ready')) return '正在记录请求';
  if (states.includes('ready')) return '部分请求采集可用';
  if (states.includes('failed')) return '请求采集失败';
  if (states.includes('pending')) return '采集初始化中';
  return '请求采集不可用';
});
