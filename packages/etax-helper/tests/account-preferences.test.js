import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {accountId,accountScope,createAccountPreferences,arrangeAccounts} from '../src/core/account-preferences.js';
const key='a'.repeat(64), other='b'.repeat(64);
function fixture(){let saved=null,fail=false;const repo=createAccountPreferences({getValue:()=>saved,setValue:(_,v)=>{if(fail)throw Error('blocked');saved=v;},now:()=>123});return {repo,get saved(){return saved;},set saved(v){saved=v;},fail:()=>fail=true};}
test('account identities reject ambiguous IDs and retain favorites across reorder, not company names',()=>{
  const rows=[{cookieId:'a',company:'Same'},{cookieId:'b',company:'Same'},{cookieId:'dup'},{cookieId:'dup'},{}];
  const preferences={favorites:['b','dup'],recent:[{id:'a',at:1},{id:'b',at:0}]};
  assert.deepEqual(arrangeAccounts(rows,preferences,'favorites'),[rows[1]]);
  assert.equal(arrangeAccounts([...rows].reverse(),preferences,'all')[0],rows[1]);
  assert.deepEqual(arrangeAccounts(rows,preferences,'recent'),[rows[0],rows[1]]);
  assert.equal(accountId({cookieId:0}),'0');assert.equal(accountId({cookieId:9007199254740992}),'');
});
test('preferences use isolated hashed contexts and persist only IDs and view times',async()=>{
  const a=await accountScope('jiangsu','PRIVATE_API_KEY',webcrypto);
  assert.notEqual(a,await accountScope('zhejiang','PRIVATE_API_KEY',webcrypto));
  assert.notEqual(a,await accountScope('jiangsu','OTHER_KEY',webcrypto));
  const f=fixture();f.repo.change(a,'favorite','id');f.repo.change(a,'view','id');
  assert.doesNotMatch(JSON.stringify(f.saved),/PRIVATE_API_KEY|OTHER_KEY|jiangsu|token|cookie/i);
  assert.deepEqual(f.repo.load(other),{favorites:[],recent:[]});
});
test('latest saved preferences are merged, recent views are unique and bounded, clearing keeps favorites',()=>{
  const f=fixture();f.repo.change(key,'favorite','one');f.repo.change(other,'favorite','other');
  for(let i=0;i<25;i++)f.repo.change(key,'view',String(i));
  f.repo.change(key,'view','20');assert.equal(f.repo.load(key).recent.length,20);assert.equal(f.repo.load(key).recent[0].id,'20');
  f.repo.change(key,'clearRecent');assert.deepEqual(f.repo.load(key),{favorites:['one'],recent:[]});assert.deepEqual(f.repo.load(other).favorites,['other']);
  f.repo.change(key,'favorite','one');assert.deepEqual(f.repo.load(key).favorites,[]);
});
test('invalid/future data, read failure and write failure cannot replace persisted preferences',()=>{
  for(const saved of [{schemaVersion:99,scopes:{}},{schemaVersion:1,scopes:{bad:{}}}]){
    const f=fixture();f.saved=saved;assert.throws(()=>f.repo.change(key,'favorite','x'));assert.equal(f.saved,saved);
  }
  const f=fixture();f.repo.change(key,'favorite','a');const saved=f.saved;f.fail();assert.throws(()=>f.repo.change(key,'favorite','b'));assert.equal(f.saved,saved);
  const bad=createAccountPreferences({getValue:()=>{throw Error('read');},setValue:()=>assert.fail('must not write')});assert.throws(()=>bad.change(key,'favorite','a'));
});
