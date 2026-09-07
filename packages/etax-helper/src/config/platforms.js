export const platforms = [
  { value: 'home', label: '新版首页', host: 'etax', path: '/loginb/' },
  { value: 'dppt', label: '发票业务', host: 'dppt', path: '/invoice-business' },
  { value: 'zhcx', label: '账户查询', host: 'etax', path: '/loginb/' },
  { value: 'ckts', label: '退税管理', host: 'etax', path: '/loginb/' }
];
export function getRegion(url) {
  const host = new URL(url).hostname;
  return /^(?:tpass|etax|dppt)\.([a-z0-9-]+)\.chinatax\.gov\.cn$/i.exec(host)?.[1] || '';
}
export function getPlatformUrl(area, platform) {
  if (!/^[a-z0-9-]+$/i.test(area)) throw new Error('无法识别当前地区，请在对应地区的电局或发票平台页面操作');
  const config = platforms.find(item => item.value === platform);
  if (!config) throw new Error('不支持的平台');
  return `https://${config.host}.${area}.chinatax.gov.cn:8443${config.path}`;
}
