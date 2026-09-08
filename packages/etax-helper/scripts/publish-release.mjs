import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {assertNewVersion,releaseNotes} from './release-utils.mjs';

// Called only by the main-branch job after both test matrices succeed.
export async function publishRelease({github,context,core}, root=new URL('../',import.meta.url)) {
  assert.equal(context.ref,'refs/heads/main','Releases must come from main');
  const pkg=JSON.parse(readFileSync(new URL('package.json',root),'utf8'));
  const version=pkg.version, tag=`etax-helper-v${version}`;
  if(context.eventName==='push') {
    const before=context.payload.before;
    assert.match(before,/^[a-f0-9]{40}$/);
    const previous=JSON.parse(execFileSync('git',['show',`${before}:packages/etax-helper/package.json`],{encoding:'utf8'})).version;
    if(previous===version){core.info('Version unchanged; checks only, no release.');return;}
    assertNewVersion(previous,version);
  } else assert.equal(context.eventName,'workflow_dispatch');
  const notes=releaseNotes(readFileSync(new URL('CHANGELOG.md',root),'utf8'),version);
  const bundle=readFileSync(new URL('dist/etax-helper.user.js',root));
  assert.equal(bundle.toString().match(/@version\s+(\S+)/)?.[1],version,'Asset version mismatch');
  const digest=data=>createHash('sha256').update(data).digest('hex');
  const assets=[{name:'etax-helper.user.js',data:bundle,type:'application/javascript'},
    {name:'SHA256SUMS.txt',data:Buffer.from(`${digest(bundle)}  etax-helper.user.js\n`),type:'text/plain'}];
  const repo=context.repo;
  const optional=async fn=>{try{return (await fn()).data;}catch(error){if(error.status!==404)throw error;return null;}};
  const ref=await optional(()=>github.rest.git.getRef({...repo,ref:`tags/${tag}`}));
  if(ref)assert.equal(ref.object.sha,context.sha,'Existing version tag points to another commit; use a new version.');
  else await github.rest.git.createRef({...repo,ref:`refs/tags/${tag}`,sha:context.sha});
  let release=await optional(()=>github.rest.repos.getReleaseByTag({...repo,tag}));
  const body=`${notes}\n\n## 安装与回退\n\n下载下方 etax-helper.user.js，由油猴确认安装，然后刷新电局页面。\n\n历史版本仅回退脚本，不回退配置。回退前保留脚本管理器备份并暂停此脚本自动更新；遇到配置格式不兼容请恢复新版，勿删除配置。\n\n源码提交：${context.sha}\n\n安装包保留原 main 更新地址；SHA256SUMS.txt 用于核对下载文件。`;
  if(!release) release=(await github.rest.repos.createRelease({...repo,tag_name:tag,target_commitish:context.sha,name:`ETax Helper ${version}`,body,draft:true,prerelease:false})).data;
  const existing=await github.paginate(github.rest.repos.listReleaseAssets,{...repo,release_id:release.id,per_page:100});
  if(!release.draft) {
    for(const asset of assets)assert.ok(existing.some(item=>item.name===asset.name && item.digest===`sha256:${digest(asset.data)}`),'Published assets differ or cannot be verified; never overwrite a published release.');
    core.info(`Already published: ${release.html_url}`);return;
  }
  // Resume interrupted drafts, without modifying published releases or moving tags.
  for(const asset of assets) {
    for(const old of existing.filter(item=>item.name===asset.name))await github.rest.repos.deleteReleaseAsset({...repo,asset_id:old.id});
    const uploaded=(await github.rest.repos.uploadReleaseAsset({...repo,release_id:release.id,name:asset.name,data:asset.data,headers:{'content-type':asset.type,'content-length':asset.data.length}})).data;
    assert.equal(uploaded.size,asset.data.length,'Incomplete release asset');
    assert.equal(uploaded.digest,`sha256:${digest(asset.data)}`,'Release asset checksum mismatch');
  }
  await github.rest.repos.updateRelease({...repo,release_id:release.id,body,draft:false,make_latest:'false'});
  core.info(`Published ${tag}`);
}
