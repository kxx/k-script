import assert from 'node:assert/strict';
import { Script } from 'node:vm';
import {readFileSync} from 'node:fs';
const {version}=JSON.parse(readFileSync(new URL('../package.json', import.meta.url),'utf8'));
const bundle=readFileSync(new URL('../dist/etax-helper.user.js',import.meta.url),'utf8');
const metadata=bundle.slice(0,bundle.indexOf('// ==/UserScript=='));
assert.match(metadata,new RegExp(`@version\\s+${version.replaceAll('.', '\\.')}\\s`));
assert.doesNotMatch(metadata,/@require\s/,'Dependencies must stay bundled, without a CDN bridge.');
assert.doesNotMatch(bundle,/\b(?:new\s+)?Function\s*\(/,'A Function constructor can prevent startup under CSP in a userscript sandbox.');
assert.doesNotMatch(bundle,/\beval\s*\(/,'The userscript must not require unsafe-eval.');
const url='https://raw.githubusercontent.com/kxx/k-script/main/packages/etax-helper/dist/etax-helper.user.js';
for(const key of ['updateURL','downloadURL']) assert.equal(metadata.match(new RegExp(`@${key}\\s+(\\S+)`))?.[1],url);
console.log('Userscript checks passed: version, fixed update URLs, no CDN or dynamic code evaluation.');

const grants=['GM_getValue','GM_setValue','GM_openInTab','GM_xmlhttpRequest','GM_setClipboard','unsafeWindow'];
for(const name of grants) {
  assert.match(metadata,new RegExp(`@grant\\s+${name}(?:\\s|$)`));
  assert.doesNotMatch(bundle,new RegExp(`\\.\\s*${name}\\b`),`${name} must be resolved from the userscript scope, not a window property.`);
}
console.log('Userscript scope checks passed: explicit grants and no window-property GM access.');

// Toolchain migrations must preserve installation scope and classic-script output.
const values = key => [...metadata.matchAll(new RegExp(`@${key}\\s+([^\\r\\n]+)`, 'g'))].map(match => match[1].trim());
assert.deepEqual(values('match'), ['https://*.chinatax.gov.cn/*', 'https://*.chinatax.gov.cn:8443/*']);
assert.deepEqual(values('connect'), ['skynjweb.com']);
assert.deepEqual(values('run-at'), ['document-start']);
assert.deepEqual(values('namespace'), ['https://github.com/kxx/k-script']);
assert.doesNotThrow(() => new Script(bundle), 'The built userscript must parse as a classic script, without module imports.');
console.log('Installation contract passed: host/port scope, API host, early startup and classic-script syntax.');
