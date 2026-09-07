import { ElMessage } from 'element-plus';
let container;
export const setNoticeContainer = value => { container = value; };
export const showError = message => ElMessage({ message: String(message), type: 'error', appendTo: container, duration: 5000 });
export const showSuccess = message => ElMessage({ message, type: 'success', appendTo: container });
