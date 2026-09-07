// Tampermonkey can inject GM APIs as userscript-scope bindings, not window properties.
// Keep these identifiers free: bundling must not replace them with window.GM_*.
function callApi(name, api, args) {
  if (typeof api !== 'function') throw new Error(`油猴接口 ${name} 不可用，请检查脚本权限后刷新页面`);
  return api(...args);
}
export const getValue = (...args) => callApi('GM_getValue', typeof GM_getValue === 'function' ? GM_getValue : null, args);
export const setValue = (...args) => callApi('GM_setValue', typeof GM_setValue === 'function' ? GM_setValue : null, args);
export const openInTab = (...args) => callApi('GM_openInTab', typeof GM_openInTab === 'function' ? GM_openInTab : null, args);
export const xmlHttpRequest = (...args) => callApi('GM_xmlhttpRequest', typeof GM_xmlhttpRequest === 'function' ? GM_xmlhttpRequest : null, args);
export const setClipboard = (...args) => callApi('GM_setClipboard', typeof GM_setClipboard === 'function' ? GM_setClipboard : null, args);
export const getPageWindow = () => typeof unsafeWindow !== 'undefined' && unsafeWindow ? unsafeWindow : window;
