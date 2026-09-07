import { getPlatformUrl } from '../config/platforms.js';
import { writeLoginCookies } from '../core/cookies.js';
/** Cookie validation must finish before navigation; no credentials are persisted here. */
export function createManualLogin({document, getClientId, openInTab, navigate}) {
  return (form, {area, newTab}) => {
    const url = getPlatformUrl(area, form.platform);
    writeLoginCookies(form, {document, clientId: form.platform === 'dppt' ? '' : getClientId() || ''});
    if (newTab) openInTab(url, {active: true}); else navigate(url);
    return 'Cookie 已写入并通过读取检查。登录是否有效，请以目标页面结果为准。';
  };
}
