import {redact} from './format.js';
const sensitive = /token|password|passwd|cookie|api[-_]?key|authorization|secret|credential|session|ticket/i;
const quote = value => `'${String(value).replaceAll("'", "'\\''")}'`;
export function requestUrl(record, base) {
  const url = new URL(record.absoluteUrl || record.url, base);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('仅支持 HTTP/HTTPS 请求');
  url.username = ''; url.password = ''; url.hash = '';
  return url;
}
export function groupRequests(records, base) {
  const groups = new Map();
  for (const record of records) {
    let address;
    try { const url = requestUrl(record, base); address = url.origin + url.pathname; }
    catch { address = record.url.split(/[?#]/)[0]; }
    const key = `${record.method} ${address}`;
    if (!groups.has(key)) groups.set(key, {key, method: record.method, address, records: [], failures: 0});
    const group = groups.get(key); group.records.push(record);
    if (record.status >= 400 || record.outcome !== '完成') group.failures++;
  }
  return [...groups.values()];
}
function redactJson(text) {
  JSON.parse(text); // Validate only; do not reserialize numbers or alter signed payload formatting.
  const tokens = [...text.matchAll(/"(?:\\.|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\]:,]/g)];
  const replacements = []; let index = 0;
  function walk(mask = false, suppressed = false) {
    const start = tokens[index].index, first = tokens[index++][0];
    if (first === '{') {
      while (tokens[index][0] !== '}') {
        const key = JSON.parse(tokens[index++][0]); index++; // colon
        walk(sensitive.test(key), suppressed || mask);
        if (tokens[index][0] === ',') index++;
      }
      index++;
    } else if (first === '[') {
      while (tokens[index][0] !== ']') {
        walk(false, suppressed || mask);
        if (tokens[index][0] === ',') index++;
      }
      index++;
    } else if (!mask && !suppressed && first.startsWith('"')) {
      const original = JSON.parse(first), cleaned = redact(original);
      if (original !== cleaned) replacements.push([start, start + first.length, JSON.stringify(cleaned)]);
    }
    const last = tokens[index - 1];
    if (mask && !suppressed) replacements.push([start, last.index + last[0].length, '"***"']);
  }
  walk();
  for (const [start,end,value] of replacements.sort((a,b) => b[0] - a[0])) text = text.slice(0,start) + value + text.slice(end);
  return text;
}
export function createCurl(record, base) {
  const url = requestUrl(record, base);
  // Process every occurrence, including duplicate and percent-encoded parameter names.
  const params = [...url.searchParams].map(([key, value]) => [key, sensitive.test(key) || /^(?:code|state)$/i.test(key) ? '***' : redact(value)]);
  url.search = new URLSearchParams(params).toString();
  const args = ['curl', '--disable', '--globoff', '--request', quote(record.method), '--url', quote(url.href)];
  const notes = ['Bash 模板：未采集请求头和 Cookie，请补充必要信息；敏感字段已脱敏，执行前请核对。'];
  if (record.data) {
    if (record.requestBodyState !== 'complete') notes.push('请求体不完整或不可读取，未加入命令。');
    else {
      let data;
      try { data = redactJson(record.data); }
      catch {
        if (/^[^=&\s]+=[\s\S]*$/.test(record.data)) data = new URLSearchParams([...new URLSearchParams(record.data)].map(([key,value]) => [key,sensitive.test(key)?'***':redact(value)])).toString();
      }
      if (data === undefined) notes.push('未识别的文本请求体未加入命令，请手动补充。');
      else {
        // Suppress curl's automatic form Content-Type; the original header was not captured.
        args.push('--header', quote('Content-Type:'), '--data-raw', quote(data));
      }
    }
  }
  return notes.map(note => '# ' + note).join('\n') + '\n' + args.join(' ');
}
export function bodyNotice(state, request = false) {
  const name = request ? '请求体' : '响应';
  if (state === 'truncated') return `${name}已截断，仅展示已采集部分。`;
  if (state === 'limit') return `${name}达到采集上限，可能不完整；未继续读取后续内容。`;
  if (state === 'unavailable') return `${name}未完整读取，当前展示的是摘要或类型说明。`;
  return '';
}
