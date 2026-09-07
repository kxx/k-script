import { createApp, shallowRef, ref } from 'vue';
import { getPageWindow } from './core/userscript';
import App from './App.vue';
import helperCss from './style.css?inline';
import elementCss from 'element-plus/dist/index.css?inline';
import { installNetwork } from './core/network';
import { parseCookies } from './core/cookies';
import { setNoticeContainer } from './utils/notice';
import { reloadConfig } from './stores/config';
import { runtime, fail } from './stores/runtime';
const records = shallowRef([]), paused = ref(false);
let network, unsubscribe = () => {}, dispose = () => { unsubscribe(); network?.uninstall(); };
function retryNetwork() {
  try {
    if (network) network.retry();
    else {
      network = installNetwork(getPageWindow(), {
        getToken: () => parseCookies(document.cookie)['dzfp-ssotoken'] || '',
        onStatus: status => {
          Object.assign(runtime, status);
          for (const module of ['xhr', 'fetch']) if (status[module] === 'failed') fail(module, 'HOOK_INSTALL_FAILED');
        },
      });
      unsubscribe = network.subscribe(value => { records.value = value; });
    }
    network.setPaused(paused.value);
  } catch { fail('xhr', 'NETWORK_INIT_FAILED'); fail('fetch', 'NETWORK_INIT_FAILED'); }
}
const collector = {
  clear: () => network?.clear(), getToken: record => network?.getToken(record) || '',
  setPaused: value => network?.setPaused(value),
};
// Each module catches its own failures; recording still starts at document-start.
reloadConfig();
retryNetwork();
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
  const app = createApp(App);
  app.config.errorHandler = () => fail('ui', 'UI_RENDER_FAILED');
  dispose = () => {
    rootObserver.disconnect(); documentObserver.disconnect(); unsubscribe();
    network?.uninstall(); app.unmount(); host.remove(); setNoticeContainer(null);
    window.removeEventListener('pagehide', onPageHide);
  };
  app.provide('collector',collector).provide('records',records).provide('paused',paused)
    .provide('overlay',overlay).provide('retryNetwork',retryNetwork).mount(container);
  if (runtime.ui !== 'failed') runtime.ui = 'ready';
}
function safeMount() { try { mount(); } catch { fail('ui', 'UI_MOUNT_FAILED'); } }
function onPageHide(event) { if (!event.persisted) { document.removeEventListener('DOMContentLoaded', safeMount); dispose(); } }
window.addEventListener('pagehide', onPageHide);
if (document.body) safeMount(); else document.addEventListener('DOMContentLoaded', safeMount, {once:true});
