import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeAccounts, filterAccounts, createAccountQuery} from '../src/services/accounts.js';
import {createManualLogin} from '../src/services/manual-login.js';
test('account normalization preserves current/legacy field contracts and search',()=>{
 const rows=normalizeAccounts({workspaces:[{name:'TAX-1',name2:'甲企业',name3:'用户',cookieId:'ID-A'},{nsrsbh:'NEW',name:'old',nsrmc:'乙企业',username:'new user',status:'有效'}]});
 assert.equal(rows[0].statusText,'未校验');assert.equal(rows[1].taxNo,'NEW');
 assert.equal(filterAccounts(rows,' id-a ')[0],rows[0]);assert.equal(filterAccounts(rows,'乙')[0],rows[1]);assert.equal(filterAccounts(rows,'tax-1')[0],rows[0]);
 assert.throws(()=>normalizeAccounts({workspaces:[null]}));assert.throws(()=>normalizeAccounts({}));
});
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
test('query suppresses duplicate calls and cannot overwrite newer account context',async()=>{
 const calls=[],pending=[],state={rows:[],error:'',loading:false};let context={area:'jiangsu',apiKey:'old'};
 const query=createAccountQuery({state,getContext:()=>context,load:args=>{calls.push(args);const d=deferred();pending.push(d);return d.promise;}});
 const first=query.refresh();await query.refresh();assert.equal(calls.length,1);assert.deepEqual(calls[0],{areaName:'jiangsu'});
 context={...context,apiKey:'new'};query.invalidate();const second=query.refresh();
 pending[1].resolve({workspaces:[{name:'new'}]});await second;
 pending[0].resolve({workspaces:[{name:'old'}]});await first;assert.equal(state.rows[0].taxNo,'new');assert.equal(state.loading,false);
});
test('disposed query ignores both successes and failures; invalid context never reaches service',async()=>{
 for(const fail of [false,true]){
  const state={rows:[],error:'',loading:false},d=deferred();const query=createAccountQuery({state,getContext:()=>({apiKey:'key',area:'jiangsu'}),load:()=>d.promise});
  const request=query.refresh();query.dispose();if(fail)d.reject(Error('late'));else d.resolve({workspaces:[{name:'late'}]});await request;
  assert.deepEqual(state.rows,[]);assert.equal(state.error,'');
 }
 for(const context of [{apiKey:''},{apiKey:'key',area:''}]){let calls=0;const state={};const query=createAccountQuery({state,getContext:()=>context,load:()=>calls++});await query.refresh();assert.equal(calls,0);}
});
function loginSetup(blocked=false) {
 const jar=new Map(),events=[];const document={get cookie(){return [...jar].map(([k,v])=>`${k}=${v}`).join('; ');},set cookie(value){events.push(['cookie',value]);if(!blocked){const entry=value.split(';')[0],i=entry.indexOf('=');jar.set(entry.slice(0,i),entry.slice(i+1));}}};
 const login=createManualLogin({document,getClientId:()=>{events.push(['clientId']);return 'client';},openInTab:(...args)=>events.push(['tab',...args]),navigate:url=>events.push(['navigate',url])});
 return {login,events};
}
test('manual login writes and verifies before navigating, preserving all platform routes and tab preference',()=>{
 for(const platform of ['home','dppt','zhcx','ckts'])for(const newTab of [true,false]){
  const {login,events}=loginSetup();login({platform,tpassToken:'t==',checkToken:'c',dzfpToken:'d'},{area:'jiangsu',newTab});
  const last=events.at(-1);assert.equal(last[0],newTab?'tab':'navigate');assert.match(last[1],platform==='dppt'?/dppt.jiangsu.chinatax.gov.cn:8443\/invoice-business$/:/etax.jiangsu.chinatax.gov.cn:8443\/loginb\/$/);
  if(newTab)assert.deepEqual(last[2],{active:true});assert(events.some(e=>e[0]==='cookie'));assert.equal(events.some(e=>e[0]==='clientId'),platform!=='dppt');
 }
});
test('invalid input or blocked cookies never opens target page',()=>{
 const {login,events}=loginSetup(true);assert.throws(()=>login({platform:'dppt',checkToken:'c',dzfpToken:'d'},{area:'jiangsu',newTab:true}));assert(!events.some(e=>e[0]==='tab'));
 const s=loginSetup();assert.throws(()=>s.login({platform:'home',tpassToken:''},{area:'jiangsu',newTab:true}));assert(!s.events.some(e=>e[0]==='cookie'||e[0]==='tab'));
 assert.throws(()=>s.login({platform:'unknown'},{area:'jiangsu',newTab:true}));
});
