import { createApp, shallowRef, ref } from 'vue';
import { unsafeWindow } from '$';
import App from './App.vue';
import helperCss from './style.css?inline';
import elementCss from 'element-plus/dist/index.css?inline';
import { installNetwork } from './core/network';
import { parseCookies } from './core/cookies';
import { setNoticeContainer } from './utils/notice';
// Install before mounting the panel; DOM readiness does not delay collection.
const collector = installNetwork(unsafeWindow, { getToken: () => parseCookies(document.cookie)['dzfp-ssotoken'] || '' });
function mount() {
  if (document.getElementById('etax-helper')) return;
  const host = document.createElement('div'); host.id = 'etax-helper';
  const shadow = host.attachShadow({mode: 'open'});
  const style = document.createElement('style');
  style.textContent = elementCss.replaceAll(':root', ':host') + helperCss + '\n:host{all:initial;font-family:Arial,"Microsoft YaHei",sans-serif;font-size:14px;color:#303133;--el-color-primary:#409eff}';
  shadow.append(style);
  const container = document.createElement('div'), overlay = document.createElement('div');
  shadow.append(container, overlay); document.body.append(host);
  setNoticeContainer(overlay);
  const records = shallowRef([]), paused = ref(false);
  collector.subscribe(value => {records.value = value;});
  createApp(App).provide('collector',collector).provide('records',records).provide('paused',paused).provide('overlay',overlay).mount(container);
}
if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount, {once:true});
