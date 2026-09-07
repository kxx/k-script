import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=await import(process.env.ETAX_PLAYWRIGHT_MODULE || 'playwright');
const fixtureFile=name=>readFileSync(process.env.ETAX_TEST_MODULES?`${process.env.ETAX_TEST_MODULES}/${name}`:require.resolve(name),'utf8');
const bundle=readFileSync(new URL('../../dist/etax-helper.user.js',import.meta.url),'utf8');
const vue=fixtureFile('vue2/dist/vue.runtime.min.js'),element=fixtureFile('element-ui/lib/index.js'),css=fixtureFile('element-ui/lib/theme-chalk/index.css');
const browser=await chromium.launch({headless:true,executablePath:process.env.ETAX_CHROMIUM_PATH||undefined,args:JSON.parse(process.env.ETAX_CHROMIUM_ARGS||'[]')});
try {
 for(const failure of ['none','config','xhr','fetch','both','legacy','future']) {
  const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const boot=`${vue}\n${element}\n
    const originalVue=window.Vue, originalElement=window.ELEMENT;
    window.fixture={readFailed:${failure==='config'},saved:{apiKey:'PRIVATE_API_KEY',width:840,newTab:false},writes:0,copied:''};
    if(${failure==='legacy'}) {localStorage.setItem('etax_helper_config',JSON.stringify(fixture.saved));fixture.saved=null;}
    if(${failure==='future'}) fixture.saved.schemaVersion=99;
    const originalSend=XMLHttpRequest.prototype.send, originalFetch=window.fetch;
    fixture.hooksRestored=()=>XMLHttpRequest.prototype.send===originalSend&&window.fetch===originalFetch;
    if(${['xhr','both'].includes(failure)}) Object.defineProperty(XMLHttpRequest.prototype,'send',{value:originalSend,writable:false,configurable:true});
    if(${['fetch','both'].includes(failure)}) Object.defineProperty(window,'fetch',{value:originalFetch,writable:false,configurable:true});
    fixture.recover=()=>{fixture.readFailed=false;if(${failure==='future'}) delete fixture.saved.schemaVersion;if(${['xhr','both'].includes(failure)}) Object.defineProperty(XMLHttpRequest.prototype,'send',{value:originalSend,writable:true,configurable:true});if(${['fetch','both'].includes(failure)}) Object.defineProperty(window,'fetch',{value:originalFetch,writable:true,configurable:true});};
    document.addEventListener('DOMContentLoaded',()=>{
      new Vue({render:h=>h('el-button',{attrs:{id:'host-button'},on:{click:()=>fixture.hostClicked=true}},['主系统按钮'])}).$mount('#host');
      fixture.hostStyle=()=>{const style=getComputedStyle(document.getElementById('host-button'));return [style.color,style.backgroundColor,style.fontSize,document.body.className,document.body.style.cssText]};
      fixture.before=fixture.hostStyle();
    },{once:true});
    ((GM_getValue,GM_setValue,GM_openInTab,GM_xmlhttpRequest,GM_setClipboard,GM_info,unsafeWindow,self,global)=>{
      ${bundle}
    })((key,fallback)=>{if(fixture.readFailed)throw Error('PRIVATE_TOKEN in https://secret.invalid/?token=PRIVATE_TOKEN');return fixture.saved;},
      (key,value)=>{fixture.writes++;fixture.saved=value;},()=>{},
      options=>options.onload({status:200,responseText:'{"code":0,"data":{"workspaces":[]}}'}),
      text=>fixture.copied=text,{scriptHandler:'Tampermonkey',version:'5.4.1'},window,{Object:function SandboxObject(){}},undefined);
    fixture.globalsUntouched=()=>Vue===originalVue&&ELEMENT===originalElement&&window.GM_getValue===undefined;
  `;
  await page.route('**/*',route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/fixture.js')return route.fulfill({contentType:'application/javascript; charset=utf-8',body:boot});
    if(path==='/host.css')return route.fulfill({contentType:'text/css',body:css});
    if(path==='/once')return route.fulfill({contentType:'application/json',body:'{"ok":true}'});
    return route.fulfill({headers:{'Content-Security-Policy':"script-src 'nonce-test'; object-src 'none'"},contentType:'text/html; charset=utf-8',body:'<html><head><link rel="stylesheet" href="/host.css"><script nonce="test" src="/fixture.js"></script></head><body><div id="host"></div></body></html>'});
  });
  await page.goto('https://etax.jiangsu.chinatax.gov.cn:8443/private-path?token=PRIVATE_URL#PRIVATE_HASH');
  assert.deepEqual(errors,[],`startup errors (${failure})`);
  const launcher=page.getByRole('button',{name:'打开 ETax 助手',exact:true});await launcher.click();
  assert(await page.evaluate(()=>fixture.globalsUntouched()));
  assert.deepEqual(await page.evaluate(()=>fixture.hostStyle()),await page.evaluate(()=>fixture.before));
  await page.getByRole('button',{name:'设置',exact:true}).click();
  assert.equal(await page.locator('.diagnostics').getAttribute('open'),null);
  await page.getByText('运行诊断',{exact:true}).click();
  const diagnosticValue=label=>page.locator('.diagnostics dt').filter({hasText:label}).locator('xpath=following-sibling::dd[1]');
  assert.equal(await diagnosticValue('XHR').innerText(),['xhr','both'].includes(failure)?'失败':'正常');
  assert.equal(await diagnosticValue('Fetch').innerText(),['fetch','both'].includes(failure)?'失败':'正常');
  assert.equal(await diagnosticValue('配置').innerText(),['config','future'].includes(failure)?'失败':'正常');
  if(['config','future'].includes(failure)) {
    await page.getByRole('button',{name:'保存设置',exact:true}).click();
    assert.equal(await page.evaluate(()=>fixture.writes),0);
    assert.equal(await page.evaluate(()=>fixture.saved.apiKey),'PRIVATE_API_KEY');
    if(failure==='future')assert.equal(await page.evaluate(()=>fixture.saved.schemaVersion),99);
  }
  await page.getByRole('button',{name:'复制诊断',exact:true}).click();
  const copied=await page.evaluate(()=>fixture.copied);
  assert.doesNotMatch(copied,/PRIVATE_|private-path|secret.invalid|\?token/);
  assert.match(copied,/Tampermonkey/);
  if(failure!=='none') {
    await page.evaluate(()=>fixture.recover());
    await page.getByRole('button',{name:'重试读取配置',exact:true}).click();
    assert.equal(await page.getByPlaceholder('填写账户服务的 API Key').inputValue(),'PRIVATE_API_KEY');
    for(let i=0;i<3;i++)await page.getByRole('button',{name:'重试请求采集',exact:true}).click();
    assert.equal(await diagnosticValue('XHR').innerText(),'正常');assert.equal(await diagnosticValue('Fetch').innerText(),'正常');
  }
  assert.equal(await page.evaluate(()=>fixture.saved.width),840);
  await page.getByRole('button',{name:'返回',exact:true}).click();
  await page.getByRole('button',{name:'请求',exact:true}).click();
  assert.equal(await page.evaluate(()=>fixture.saved.schemaVersion),1);
  if(failure==='legacy')assert.equal(await page.evaluate(()=>localStorage.getItem('etax_helper_config')),null);
  await page.evaluate(()=>new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('GET','/once');xhr.onload=resolve;xhr.onerror=reject;xhr.send();}));
  await page.getByRole('button',{name:'/once',exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'/once',exact:true}).count(),1);
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
  assert.equal(await launcher.count(),1);
  await page.evaluate(()=>document.getElementById('etax-helper').remove());
  await launcher.waitFor();assert.equal(await launcher.count(),1);
  await page.getByRole('button',{name:'关闭助手',exact:true}).click();
  await page.locator('#host-button').click();assert(await page.evaluate(()=>fixture.hostClicked));
  await page.evaluate(()=>document.body.replaceChildren(document.createElement('main')));
  await launcher.click();assert(await page.getByRole('dialog',{name:'ETax 助手',exact:true}).isVisible());
  assert.deepEqual(errors,[]);
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false})));
  assert.equal(await launcher.count(),0);
  assert(await page.evaluate(()=>fixture.hooksRestored()));
  await page.close();console.log(`PASS generated userscript: strict CSP, lexical GM APIs, Vue 2 + Element UI, ${failure} failure/recovery, diagnostics privacy, host recovery`);
 }
} finally {await browser.close();}
