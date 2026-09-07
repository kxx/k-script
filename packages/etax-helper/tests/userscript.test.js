import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/core/userscript.js',import.meta.url),'utf8').replace(/^export /gm,'');
function load({bindings=true}={}) {
  const window={}, page={}, calls=[];
  const context=vm.createContext({window,page,calls});
  if(bindings)vm.runInContext(`
    const unsafeWindow=page;
    const GM_getValue=(...args)=>{calls.push(['get',...args]);return 'saved';};
    const GM_setValue=(...args)=>calls.push(['set',...args]);
    const GM_openInTab=(...args)=>calls.push(['tab',...args]);
    const GM_xmlhttpRequest=(...args)=>calls.push(['request',...args]);
    const GM_setClipboard=(...args)=>calls.push(['clipboard',...args]);
  `,context);
  vm.runInContext(source+'\nthis.api={getValue,setValue,openInTab,xmlHttpRequest,setClipboard,getPageWindow};',context);
  return {api:context.api,window,page,calls};
}
test('GM APIs work as lexical bindings without window properties',()=>{
  const {api,window,page,calls}=load();
  assert.equal(window.GM_getValue,undefined);
  assert.equal(api.getValue('key',null),'saved');api.setValue('key','value');api.openInTab('/login',{active:true});api.xmlHttpRequest({url:'/api'});api.setClipboard('text');
  assert.equal(api.getPageWindow(),page);
  assert.deepEqual(calls.map(call=>call[0]),['get','set','tab','request','clipboard']);
});
test('unavailable GM APIs fail with an actionable error only on use',()=>{
  const {api,window}=load({bindings:false});
  assert.equal(api.getPageWindow(),window);
  assert.throws(()=>api.getValue('key'),/GM_getValue.*不可用/);
  assert.throws(()=>api.setClipboard('text'),/GM_setClipboard.*不可用/);
});
