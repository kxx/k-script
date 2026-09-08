import test from 'node:test';
import assert from 'node:assert/strict';
import {installNetwork} from '../src/core/network.js';
import {parseCookies, writeLoginCookies} from '../src/core/cookies.js';
import {getRegion, getPlatformUrl} from '../src/config/platforms.js';
import {createRequest} from '../src/services/request.js';
import {format, redact} from '../src/utils/format.js';
class FakeXHR extends EventTarget {
  open(method,url) { this.method=method;this.url=url;return 'opened'; }
  send(data) { this.sent=data;return 'sent'; }
  complete({type='load',response='ok',responseType='',status=200}={}) {
    this.status=status;this.responseType=responseType;this.response=response;
    Object.defineProperty(this,'responseText',{configurable:true,get(){if(responseType && responseType!=='text')throw Error('InvalidState');return response;}});
    this.dispatchEvent(new Event(type));this.dispatchEvent(new Event('loadend'));
  }
}
function setup(extra={}) {
  class XHR extends FakeXHR {}
  const target={XMLHttpRequest:XHR,URLSearchParams,FormData,...extra};
  const api=installNetwork(target,{getToken:()=> 'original-token',maxLength:32});let records=[];
  api.subscribe(value=>records=value);
  return {target,api,records:()=>records};
}
test('one collector; repeated subscriptions never duplicate XHR; preserves args and return values',()=>{
 const s=setup();assert.equal(installNetwork(s.target),s.api);
 for(let i=0;i<10;i++){const unsubscribe=s.api.subscribe(()=>{});unsubscribe();}
 const xhr=new s.target.XMLHttpRequest();assert.equal(xhr.open('POST','/api'),'opened');assert.equal(xhr.send('body'),'sent');xhr.complete();
 assert.equal(s.records().length,1);assert.equal(s.records()[0].data,'body');assert.equal(xhr.sent,'body');assert.equal(s.api.getToken(s.records()[0]),'original-token');
 xhr.open('GET','/again');xhr.send();xhr.complete();assert.equal(s.records().length,2);
});
test('XHR handles binary, JSON, FormData, failure, timeout and abort',()=>{
 const s=setup();for(const type of ['error','timeout','abort']){const xhr=new s.target.XMLHttpRequest();xhr.open('GET','/api');xhr.send(new FormData());xhr.complete({type,status:0,responseType:'blob'});}
 assert.deepEqual(s.records().map(r=>r.outcome),['已取消','超时','网络错误']);
 const xhr=new s.target.XMLHttpRequest();xhr.open('GET','/json');xhr.send();xhr.complete({responseType:'json',response:{ok:true}});assert.equal(s.records()[0].response,'{"ok":true}');
});
test('bounded records, response truncation, pause and clear in-flight requests',()=>{
 const s=setup();for(let i=0;i<60;i++){const x=new s.target.XMLHttpRequest();x.open('GET','/'+i);x.send();x.complete({response:'x'.repeat(100)});}
 assert.equal(s.records().length,50);assert.match(s.records()[0].response,/截断/);
 const x=new s.target.XMLHttpRequest();x.open('GET','/pending');x.send();s.api.clear();x.complete();assert.equal(s.records().length,0);
 s.api.setPaused(true);x.open('GET','/paused');x.send();x.complete();assert.equal(s.records().length,0);
});
test('collector subscriber failure cannot break original requests',()=>{
 const s=setup();s.api.subscribe(()=>{if(s.records().length)throw Error('UI failed');});
 const xhr=new s.target.XMLHttpRequest();xhr.open('GET','/');xhr.send();assert.doesNotThrow(()=>xhr.complete());
});
test('fetch preserves original promise, response and body; caps cloned text',async()=>{
 const response=new Response('x'.repeat(100),{headers:{'content-type':'text/plain'}}),promise=Promise.resolve(response);
 const s=setup({fetch:()=>promise});const result=s.target.fetch('/fetch',{method:'POST',body:'hello'});
 assert.equal(result,promise);assert.equal(await result,response);assert.equal(await response.text(),'x'.repeat(100));
 await new Promise(resolve=>setTimeout(resolve,20));assert.equal(s.records().length,1);assert.match(s.records()[0].response,/截断/);
});
test('fetch rejection stays rejected and gets recorded',async()=>{
 const failure=new TypeError('offline');const s=setup({fetch:()=>Promise.reject(failure)});
 await assert.rejects(s.target.fetch('/'),error=>error===failure);assert.equal(s.records()[0].outcome,'网络错误');
});
test('streaming fetch is never cloned',async()=>{
 const response=new Response('',{headers:{'content-type':'text/event-stream'}});response.clone=()=>{throw Error('must not clone');};
 const s=setup({fetch:()=>Promise.resolve(response)});await s.target.fetch('/events');assert.match(s.records()[0].response,/流式/);
});
test('cookie parser preserves equals and encoding',()=>{
 assert.deepEqual(parseCookies('a=abc==; token=x%2By%3D; bad=%zz'),{a:'abc==',token:'x+y=',bad:'%zz'});
});
test('login validates before writing; blocked cookies fail; compatible cookie values survive',()=>{
 let writes=0;const blocked={get cookie(){return '';},set cookie(v){writes++;}};
 assert.throws(()=>writeLoginCookies({platform:'home',tpassToken:'x'},{document:blocked}),/clientId/);assert.equal(writes,0);
 assert.throws(()=>writeLoginCookies({platform:'dppt',checkToken:'x',dzfpToken:'y'},{document:blocked}),/写入/);
 const jar=new Map();const doc={get cookie(){return [...jar].map(([k,v])=>`${k}=${v}`).join('; ');},set cookie(v){const entry=v.split(';')[0],i=entry.indexOf('=');jar.set(entry.slice(0,i),entry.slice(i+1));}};
 writeLoginCookies({platform:'dppt',checkToken:'x+=',dzfpToken:'a=='},{document:doc});assert.equal(parseCookies(doc.cookie)['dzfp-ssotoken'],'a==');
});
test('region and platform URLs retain existing routes and reject unknown hosts',()=>{
 assert.equal(getRegion('https://etax.jiangsu.chinatax.gov.cn:8443/a?x=.bad.'),'jiangsu');
 assert.equal(getRegion('https://www.chinatax.gov.cn'), '');assert.match(getPlatformUrl('jiangsu','ckts'),/:8443\/loginb\//);assert.throws(()=>getPlatformUrl('','home'));
});
test('service normalizes HTTP, invalid JSON, business errors and timeout',async()=>{
 for(const response of [{status:500,responseText:'oops'},{status:200,responseText:'html'},{status:200,responseText:'{"code":1,"msg":"failed"}'}]){
 const request=createRequest(options=>options.onload(response),()=>({apiKey:'key'}));await assert.rejects(request('getAccount',{}));
 }
 const timeout=createRequest(options=>options.ontimeout(),()=>({apiKey:'key'}));await assert.rejects(timeout('getAccount',{}),/超时/);
 let called=false;const noKey=createRequest(()=>{called=true;},()=>({}));await assert.rejects(noKey('getAccount',{}),/API Key/);assert.equal(called,false);
});
test('service preserves account and decryption request contracts',async()=>{
 let options;const request=createRequest(value=>{options=value;value.onload({status:200,responseText:'{"code":0,"data":{"ok":true}}'});},()=>({apiKey:'key'}));
 assert.deepEqual(await request('getCookie','id'),{ok:true});assert.equal(options.data,'"id"');assert.equal(options.headers['X-API-Key'],'key');
 await request('decryptJmbw',{token:'a'},{auth:false});assert.equal(options.headers['X-API-Key'],undefined);assert.equal(options.timeout,20000);
});
test('plain response is safe to display and common secrets redact on copy',()=>{
 assert.equal(format('<html>error</html>'),'<html>error</html>');assert.equal(redact('{"token":"secret","count":2}'),'{"token":"***","count":2}');assert.equal(redact('token=abc&x=1'),'token=***&x=1');
});

test('JSON highlighting preserves content exactly and renders markup as text',async()=>{
 const {highlightJson}=await import('../src/utils/highlight.js');
 const text=JSON.stringify({name:'<img onerror="alert(1)">',amount:-1.2,ok:true,items:[null]},null,2);
 const tokens=highlightJson(text);assert.equal(tokens.map(token=>token.text).join(''),text);
 assert(tokens.some(token=>token.type==='json-key'));assert(tokens.some(token=>token.type==='json-number'));
 assert.deepEqual(highlightJson('<script>alert(1)</script>'),[{type:'',text:'<script>alert(1)</script>'}]);
});

test('XHR installation rolls back partial changes; retry keeps successful fetch hook',()=>{
 class XHR extends FakeXHR {}
 const originalOpen=XHR.prototype.open, originalSend=XHR.prototype.send;
 Object.defineProperty(XHR.prototype,'send',{value:originalSend,writable:false,configurable:true});
 const target={XMLHttpRequest:XHR,fetch:()=>Promise.resolve(new Response('ok'))};
 const api=installNetwork(target),fetchHook=target.fetch;
 assert.deepEqual(api.getStatus(),{xhr:'failed',fetch:'ready'});
 assert.equal(XHR.prototype.open,originalOpen);
 Object.defineProperty(XHR.prototype,'send',{value:originalSend,writable:true,configurable:true});
 api.retry();api.retry();
 assert.equal(target.fetch,fetchHook);assert.equal(api.getStatus().xhr,'ready');
 let records=[];api.subscribe(value=>records=value);
 const xhr=new XHR();xhr.open('GET','/once');xhr.send();xhr.complete();assert.equal(records.length,1);
 api.uninstall();assert.equal(XHR.prototype.open,originalOpen);assert.equal(XHR.prototype.send,originalSend);
});
test('failed fetch installation does not block XHR and uninstall releases pending listeners',()=>{
 class XHR extends FakeXHR {
  handlers=new Set();
  addEventListener(type,fn){this.handlers.add(fn);super.addEventListener(type,fn);}
  removeEventListener(type,fn){this.handlers.delete(fn);super.removeEventListener(type,fn);}
 }
 const target={XMLHttpRequest:XHR};
 Object.defineProperty(target,'fetch',{value:()=>{},writable:false});
 const api=installNetwork(target);assert.deepEqual(api.getStatus(),{xhr:'ready',fetch:'failed'});
 const xhr=new XHR();xhr.open('GET','/pending');xhr.send();assert(xhr.handlers.size>0);
 api.uninstall();assert.equal(xhr.handlers.size,0);
});
test('unavailable transports can be installed later; throwing XHR getter does not block fetch',()=>{
 const target={fetch:()=>Promise.resolve(new Response('ok'))};
 Object.defineProperty(target,'XMLHttpRequest',{configurable:true,get(){throw Error('blocked');}});
 const api=installNetwork(target);assert.deepEqual(api.getStatus(),{xhr:'failed',fetch:'ready'});
 class XHR extends FakeXHR {}
 Object.defineProperty(target,'XMLHttpRequest',{value:XHR});api.retry();
 assert.equal(api.getStatus().xhr,'ready');api.uninstall();
 const empty={};const later=installNetwork(empty);assert.equal(later.getStatus().xhr,'unavailable');
 empty.XMLHttpRequest=class extends FakeXHR {};later.retry();assert.equal(later.getStatus().xhr,'ready');later.uninstall();
});

test('pinning retains tokens within the 50-record cap; clear preserves pins and discards in-flight requests',()=>{
 const s=setup();const add=url=>{const x=new s.target.XMLHttpRequest();x.open('GET',url);x.send();x.complete();return s.records()[0];};
 const first=add('/keep');s.api.togglePin(first.id);
 for(let i=0;i<70;i++)add('/'+i);
 assert.equal(s.records().length,50);const pinned=s.records().find(r=>r.id===first.id);assert(pinned.pinned);assert.equal(s.api.getToken(pinned),'original-token');
 const pending=new s.target.XMLHttpRequest();pending.open('GET','/pending');pending.send();s.api.clear();pending.complete();
 assert.equal(s.records().length,1);assert.equal(s.records()[0].id,first.id);
 s.api.togglePin(first.id);assert.equal(s.records()[0].pinned,false);s.api.clear({includePinned:true});assert.equal(s.records().length,0);
 assert.throws(()=>s.api.togglePin(first.id),/移出/);
});
test('pin cap allows new records and prevents unbounded retained data',()=>{
 const s=setup();for(let i=0;i<11;i++){const x=new s.target.XMLHttpRequest();x.open('GET','/'+i);x.send();x.complete();}
 const ids=s.records().map(r=>r.id);ids.slice(0,10).forEach(id=>s.api.togglePin(id));assert.throws(()=>s.api.togglePin(ids[10]),/上限/);
 s.api.togglePin(ids[0]);s.api.togglePin(ids[10]);assert.equal(s.records().filter(r=>r.pinned).length,10);
 s.api.clear({includePinned:true});assert.equal(s.records().length,0);
});
test('capture states distinguish truncated, full and unsupported request/response bodies',()=>{
 const s=setup({location:{href:'https://example.test/base/'}});
 const x=new s.target.XMLHttpRequest();x.open('POST','child');x.send('x'.repeat(40));x.complete({response:'y'.repeat(40)});
 const r=s.records()[0];assert.equal(r.absoluteUrl,'https://example.test/base/child');assert.equal(r.requestBodyState,'truncated');assert.equal(r.responseBodyState,'truncated');
 x.open('POST','/file');x.send(new FormData());x.complete({responseType:'blob'});assert.equal(s.records()[0].requestBodyState,'unavailable');assert.equal(s.records()[0].responseBodyState,'unavailable');
 x.open('POST','/full');x.send(new URLSearchParams('a=b'));x.complete();assert.equal(s.records()[0].requestBodyState,'complete');assert.equal(s.records()[0].responseBodyState,'complete');
});
test('fetch bound is reported as a limit without claiming known truncation; Request bodies stay unread',async()=>{
 const response=new Response('x'.repeat(32),{headers:{'content-type':'text/plain'}});const s=setup({fetch:()=>Promise.resolve(response)});
 const input=new Request('https://example.test/',{method:'POST',body:'original'});await s.target.fetch(input);
 await new Promise(resolve=>setTimeout(resolve,20));assert.equal(s.records()[0].responseBodyState,'limit');assert.equal(s.records()[0].requestBodyState,'unavailable');assert.equal(await input.text(),'original');assert.equal(await response.text(),'x'.repeat(32));
});
