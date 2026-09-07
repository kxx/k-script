export function parseCookies(text = '') {
  const result = {};
  for (const entry of text.split(';')) {
    const index = entry.indexOf('=');
    if (index < 0) continue;
    const decode = value => { try { return decodeURIComponent(value); } catch { return value; } };
    result[decode(entry.slice(0, index).trim())] = decode(entry.slice(index + 1));
  }
  return result;
}
export function writeLoginCookies(params, { document: doc, clientId = '' }) {
  const required = params.platform === 'dppt' ? ['checkToken', 'dzfpToken'] : ['tpassToken'];
  for (const key of required) if (!String(params[key] || '').trim()) throw new Error(`${key} 不能为空`);
  if (params.platform !== 'dppt' && !clientId.trim()) throw new Error('当前页面没有 clientId，请先打开对应地区的电局登录页');
  const values = params.platform === 'dppt'
    ? [['SSO_SECURITY_CHECK_TOKEN', params.checkToken], ['dzfp-ssotoken', params.dzfpToken], ['security-token-key', 'dzfp-ssotoken']]
    : [[`tpass_${clientId}`, params.tpassToken]];
  // Retain the existing cross-platform domain contract until each region is verified.
  for (const [name, value] of values) {
    doc.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value.trim())}; path=/; domain=.chinatax.gov.cn; secure`;
    if (parseCookies(doc.cookie)[name] !== value.trim()) throw new Error(`Cookie ${name} 写入未通过检查，请检查浏览器设置或同名 Cookie`);
  }
}
