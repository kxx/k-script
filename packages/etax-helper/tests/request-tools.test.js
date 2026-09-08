import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createCurl, groupRequests, bodyNotice} from '../src/utils/request-tools.js';
const base='https://etax.example.test/base/';
test('groups ignore queries but distinguish origins, methods and exact paths',()=>{
 const record=(url,method='GET',status=200)=>({url,method,status,outcome:'完成'});
 const groups=groupRequests([record('/api?q=1'),record('/api?q=2','GET',500),record('/api','POST'),record('https://other.test/api'),record('/api/123')],base);
 assert.equal(groups.length,4);assert.equal(groups[0].records.length,2);assert.equal(groups[0].failures,1);assert.equal(groups[0].address,'https://etax.example.test/api');
});
test('cURL sanitizes credentials, repeated query tokens and nested JSON without changing the record',()=>{
 const record={url:'https://user:pass@example.test/a?%74oken=secret&token=again&limit=2#private',method:'POST',requestBodyState:'complete',data:JSON.stringify({password:'a"b',list:[{Authorization:['private']}],count:2})};
 const before=structuredClone(record),text=createCurl(record,base);
 assert.doesNotMatch(text,/secret|again|private|user:pass|a\\"b/);assert.match(text,/limit=2/);assert.match(text,/--data-raw/);assert.deepEqual(record,before);
});
test('shell arguments remain literal, including quotes, substitutions and newlines',()=>{
 const data=JSON.stringify({value:"a'$(printf INJECTED)`printf INJECTED`\nb"});
 const text=createCurl({url:'/api?q=%27%24%28printf%20INJECTED%29',method:'POST',data,requestBodyState:'complete'},base);
 // Stub curl: verifies shell parsing only; no network request or real command replay.
 const result=spawnSync('/bin/sh',['-c',`curl() { printf '%s\\0' "$@"; };\n${text}`],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);const args=result.stdout.split('\0');
 assert.equal(args[args.indexOf('--data-raw')+1],data);assert.equal(args[0],'--disable');assert(args.includes('--globoff'));
});
test('incomplete and opaque request bodies are omitted; no guessed content type or authentication',()=>{
 for(const state of ['truncated','unavailable',undefined]){
  const text=createCurl({url:'/api',method:'POST',data:'PRIVATE_BODY',requestBodyState:state},base);assert.doesNotMatch(text,/PRIVATE_BODY|--data-raw/);
 }
 const text=createCurl({url:'/api',method:'POST',data:'token=secret&limit=3',requestBodyState:'complete'},base);assert.doesNotMatch(text,/secret/);assert.match(text,/limit=3/);assert.match(text,/Content-Type:'/);
 assert.throws(()=>createCurl({url:'file:///etc/passwd',method:'GET'},base),/HTTP/);
 assert.match(bodyNotice('limit'),/可能不完整/);assert.match(bodyNotice('truncated',true),/请求体已截断/);
});
test('JSON export preserves large identifiers and formatting while redacting repeated/nested keys',()=>{
 const data='{ "id":9007199254740993, "value":0.1234567890123456789, "token":{"secret":"first"}, "token":"second", "ok":[] }';
 const text=createCurl({url:'/api',method:'POST',data,requestBodyState:'complete'},base);
 assert.match(text,/9007199254740993/);assert.match(text,/0.1234567890123456789/);assert.doesNotMatch(text,/first|second/);assert.match(text,/"ok":\[\]/);
});
