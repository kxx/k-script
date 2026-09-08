import assert from 'node:assert/strict';
export function versionParts(version) {
  assert.match(version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, 'Use a stable x.y.z version');
  return version.split('.').map(BigInt);
}
export function assertNewVersion(previous, next) {
  const a=versionParts(previous), b=versionParts(next);
  const index=a.findIndex((part,i)=>part!==b[i]);
  assert.ok(index>=0 && b[index]>a[index], 'Version must increase');
}
export function releaseNotes(changelog, version) {
  versionParts(version);
  const sections=changelog.split(/^## /m).slice(1);
  assert.equal(sections[0]?.split('\n')[0].trim(), version, 'Latest changelog heading must match package version');
  assert.equal(sections.filter(s=>s.split('\n')[0].trim()===version).length,1,'Duplicate changelog version');
  const notes=sections[0].slice(sections[0].indexOf('\n')+1).trim();
  assert.ok(notes && !/待补充|TODO/.test(notes), 'Release notes must be complete');
  return notes;
}
