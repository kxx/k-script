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

// Display labels only; endpoint region identifiers remain unchanged.
const regionLabels = {beijing:'北京',tianjin:'天津',hebei:'河北',shanxi:'山西',neimenggu:'内蒙古',liaoning:'辽宁',jilin:'吉林',heilongjiang:'黑龙江',shanghai:'上海',jiangsu:'江苏',zhejiang:'浙江',anhui:'安徽',fujian:'福建',jiangxi:'江西',shandong:'山东',henan:'河南',hubei:'湖北',hunan:'湖南',guangdong:'广东',guangxi:'广西',hainan:'海南',chongqing:'重庆',sichuan:'四川',guizhou:'贵州',yunnan:'云南',xizang:'西藏',shaanxi:'陕西',gansu:'甘肃',qinghai:'青海',ningxia:'宁夏',xinjiang:'新疆',dalian:'大连',ningbo:'宁波',xiamen:'厦门',qingdao:'青岛',shenzhen:'深圳'};
export const getRegionLabel = region => regionLabels[region] || region;
