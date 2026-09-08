import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {assertNewVersion,releaseNotes} from '../scripts/release-utils.mjs';
import {publishRelease} from '../scripts/publish-release.mjs';
const sha='a'.repeat(40);
function fixture({uploadFails=false,refSha=sha,published=false}={}) {
  const calls=[], assets=[];
  const release={id:1,draft:!published,html_url:'https://github.com/kxx/k-script/releases/test'};
  const github={rest:{git:{getRef:async()=>({data:{object:{sha:refSha}}}),createRef:async()=>calls.push('tag')},repos:{
    getReleaseByTag:async()=>({data:release}),listReleaseAssets:()=>{},
    createRelease:async()=>{calls.push('draft');return {data:release};},
    deleteReleaseAsset:async()=>calls.push('delete'),
    uploadReleaseAsset:async({name,data})=>{calls.push(name);if(uploadFails)throw Error('upload failed');const asset={name,size:data.length,digest:'sha256:'+createHash('sha256').update(data).digest('hex')};assets.push(asset);return {data:asset};},
    updateRelease:async(options)=>{assert.equal(options.draft,false);assert.equal(options.make_latest,'false');calls.push('publish');release.draft=false;},
  }},paginate:async()=>assets};
  const context={ref:'refs/heads/main',eventName:'workflow_dispatch',sha,repo:{owner:'kxx',repo:'k-script'}};
  return {github,context,core:{info(){}},calls,assets,release};
}
test('release version must increase and notes must match without empty/duplicate headings',()=>{
  assertNewVersion('1.2.9','1.2.10');assertNewVersion('1.9.9','2.0.0');
  for(const v of ['1.2.9','1.2.8','01.3.0','1.3.0-beta'])assert.throws(()=>assertNewVersion('1.2.9',v));
  assert.equal(releaseNotes('# 更新日志\n\n## 1.3.0\n\n- Change\n\n## 1.2.9\n- Old','1.3.0'),'- Change');
  for(const log of ['## 1.2.9\n- Wrong','## 1.3.0\n','## 1.3.0\nTODO','## 1.3.0\n- A\n## 1.3.0\n- B'])assert.throws(()=>releaseNotes(log,'1.3.0'));
});
test('release publishes only after both verified assets, and rerun preserves published assets',async()=>{
  const f=fixture();await publishRelease(f);
  assert.deepEqual(f.calls,['etax-helper.user.js','SHA256SUMS.txt','publish']);
  await publishRelease(f);assert.equal(f.calls.length,3);
  f.assets[0].digest='sha256:bad';await assert.rejects(publishRelease(f),/never overwrite/);assert.equal(f.calls.length,3);
});
test('upload failure leaves draft unpublished; tag conflicts and non-main branches cannot publish',async()=>{
  const f=fixture({uploadFails:true});await assert.rejects(publishRelease(f),/upload failed/);assert(f.release.draft);assert(!f.calls.includes('publish'));
  const conflict=fixture({refSha:'b'.repeat(40)});await assert.rejects(publishRelease(conflict),/another commit/);assert.deepEqual(conflict.calls,[]);
  const branch=fixture();branch.context.ref='refs/heads/other';await assert.rejects(publishRelease(branch),/main/);assert.deepEqual(branch.calls,[]);
});

test('first release creates a tag and draft before upload; failed draft can resume',async()=>{
  const f=fixture();const missing=async()=>{throw Object.assign(Error('not found'),{status:404});};
  f.github.rest.git.getRef=missing;f.github.rest.repos.getReleaseByTag=missing;
  await publishRelease(f);assert.deepEqual(f.calls,['tag','draft','etax-helper.user.js','SHA256SUMS.txt','publish']);
  const retry=fixture();retry.assets.push({name:'etax-helper.user.js',id:123});
  await publishRelease(retry);assert.deepEqual(retry.calls,['delete','etax-helper.user.js','SHA256SUMS.txt','publish']);
});
