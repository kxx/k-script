import { ElMessage } from 'element-plus';
let container, current;
export const setNoticeContainer = value => { container = value; };
function show(message, type, duration) {
  current?.close();
  current = ElMessage({ message: String(message), type, appendTo: container, duration });
  return current;
}
export const showError = message => show(message, 'error', 5000);
export const showSuccess = message => show(message, 'success', 2500);
