import { createApp, shallowRef, ref } from 'vue';
import { getPageWindow } from './core/userscript';
import App from './App.vue';
import helperCss from './style.css?inline';
import elementCss from 'element-plus/dist/index.css?inline';
import { installNetwork } from './core/network';
import { parseCookies } from './core/cookies';
import { setNoticeContainer } from './utils/notice';
// Install before mounting the panel; DOM readiness does not delay collection.
const collector = installNetwork(getPageWindow(), { getToken: () => parseCookies(document.cookie)['dzfp-ssotoken'] || '' });
function mount() {
  if (document.getElementById('etax-helper')) return;
  const host = document.createElement('div'); host.id = 'etax-helper';
  host.style.cssText = 'all:initial!important;position:fixed!important;inset:0!important;width:0!important;height:0!important;z-index:2147483000!important;display:block!important;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif!important;font-size:14px!important;line-height:1.5!important;color:#253247!important;color-scheme:light!important;';
  const shadow = host.attachShadow({mode: 'open'});
  const style = document.createElement('style');
  style.textContent = elementCss.replaceAll(':root', ':host') + helperCss;
  shadow.append(style);
  const container = document.createElement('div'), overlay = document.createElement('div');
  shadow.append(container, overlay);
  // Keep the launcher outside a body that a portal bootstrap may replace.
  let observedRoot;
  const rootObserver = new MutationObserver(ensureHost);
  function ensureHost() {
    const root = document.documentElement;
    if (!root) return;
    if (root !== observedRoot) {
      rootObserver.disconnect();
      rootObserver.observe(root, {childList: true});
      observedRoot = root;
    }
    if (host.parentNode !== root) root.append(host);
  }
  ensureHost();
  // Observe only root replacement/direct children, never the whole page subtree.
  const documentObserver = new MutationObserver(ensureHost);
  documentObserver.observe(document, {childList: true});
  setNoticeContainer(overlay);
  const records = shallowRef([]), paused = ref(false);
  collector.subscribe(value => {records.value = value;});
  createApp(App).provide('collector',collector).provide('records',records).provide('paused',paused).provide('overlay',overlay).mount(container);
}
if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount, {once:true});
