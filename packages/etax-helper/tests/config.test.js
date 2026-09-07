import test from 'node:test';
import assert from 'node:assert/strict';
import {createConfigRepository, migrateConfig, CONFIG_VERSION} from '../src/core/config.js';
function setup(initial, legacy = null) {
 const state={saved:initial, legacy, writes:0, removals:0, failRead:false, failWrite:false};
 const repository=createConfigRepository({
  getValue:()=>{if(state.failRead)throw Error('blocked');return structuredClone(state.saved);},
  setValue:(key,value)=>{if(state.failWrite)throw Error('blocked');state.saved=structuredClone(value);state.writes++;},
  getLegacy:()=>state.legacy, removeLegacy:()=>{state.legacy=null;state.removals++;},
 });return {state,repository};
}
test('unversioned config keeps credentials, false preferences and extensions; migration is idempotent',()=>{
 const old={apiKey:'original',newTab:false,tab:'network',width:'840',extension:{custom:true}};
 const next=migrateConfig(old);assert.equal(next.schemaVersion,CONFIG_VERSION);assert.equal(next.width,840);
 assert.equal(next.apiKey,'original');assert.equal(next.newTab,false);assert.deepEqual(next.extension,{custom:true});
 assert.deepEqual(migrateConfig(next),next);assert.equal(old.schemaVersion,undefined);
});
test('GM config wins over legacy; schema persists on successful save, with flat rollback-compatible fields',()=>{
 const {state,repository}=setup({apiKey:'gm',newTab:false},JSON.stringify({apiKey:'old-site'}));
 assert.equal(repository.load().apiKey,'gm');assert.equal(state.writes,0);
 repository.save({width:880});assert.equal(state.saved.apiKey,'gm');assert.equal(state.saved.newTab,false);
 assert.equal(state.saved.schemaVersion,1);assert.equal(state.removals,1);
});
test('legacy migration retains source until save; migration failure never deletes legacy data',()=>{
 const legacy=JSON.stringify({apiKey:'legacy',newTab:false});const {state,repository}=setup(null,legacy);
 state.failWrite=true;assert.throws(()=>repository.load());assert.equal(state.legacy,legacy);assert.equal(state.removals,0);
 assert.throws(()=>repository.save({width:900}));state.failWrite=false;
 assert.equal(repository.load().apiKey,'legacy');assert.equal(state.saved.schemaVersion,1);assert.equal(state.legacy,legacy);
 repository.save({tab:'account'});assert.equal(state.legacy,null);
});
test('read failure and failed retry cannot overwrite persisted settings; successful retry restores them',()=>{
 const {state,repository}=setup({apiKey:'keep',width:960});state.failRead=true;
 assert.throws(()=>repository.load());assert.throws(()=>repository.save({apiKey:''}));assert.equal(state.writes,0);
 state.failRead=false;assert.equal(repository.load().width,960);repository.save({tab:'network'});assert.equal(state.saved.apiKey,'keep');
});
test('future schemas, invalid types and malformed legacy data are never rewritten',()=>{
 for(const value of [{schemaVersion:2,apiKey:'future'},{newTab:'false'},{apiKey:42},{width:'oops'},[],false]){
  const {state,repository}=setup(value);assert.throws(()=>repository.load());assert.throws(()=>repository.save({width:800}));assert.equal(state.writes,0);assert.deepEqual(state.saved,value);
 }
 const {state,repository}=setup(null,'invalid JSON');assert.throws(()=>repository.load());assert.equal(state.removals,0);
});
test('partial save re-reads newer settings and unknown fields; future schema discovered during save blocks writes',()=>{
 const {state,repository}=setup({apiKey:'old'});repository.load();
 state.saved={apiKey:'new',newTab:false,extension:'keep'};const next=repository.save({width:920});
 assert.equal(next.apiKey,'new');assert.equal(next.newTab,false);assert.equal(next.extension,'keep');
 state.saved={schemaVersion:2,apiKey:'future'};assert.throws(()=>repository.save({tab:'account'}),{code:'CONFIG_VERSION_NEWER'});
 assert.equal(state.saved.schemaVersion,2);assert.equal(state.writes,1);
});
test('write failure leaves old state and legacy data intact; new installation does not eagerly write defaults',()=>{
 const {state,repository}=setup(null);const next=repository.load();assert.equal(next.width,720);assert.equal(state.writes,0);
 state.failWrite=true;assert.throws(()=>repository.save({apiKey:'new'}));assert.equal(state.saved,null);assert.equal(state.removals,0);
});
