// One collector per page window. UI subscriptions never install browser hooks.
const collectors = new WeakMap();
export function installNetwork(target, { maxRecords = 50, maxLength = 65536, getToken = () => '', onStatus = () => {} } = {}) {
  if (collectors.has(target)) return collectors.get(target);
  const records = [], listeners = new Set(), tokens = new WeakMap();
  let paused = false, sequence = 0, generation = 0, disposed = false;
  const pending = new Set(), readers = new Set();
  const status = {xhr: 'pending', fetch: 'pending'};
  const report = () => safe(() => onStatus({...status}));
  const safe = (fn, fallback = '') => { try { return fn(); } catch { return fallback; } };
  const clip = value => {
    const text = typeof value === 'string' ? value : safe(() => String(value));
    return text.length > maxLength ? text.slice(0, maxLength) + '\n[内容已截断]' : text;
  };
  const body = value => {
    if (value == null) return '';
    if (typeof value === 'string') return clip(value);
    if (target.URLSearchParams && value instanceof target.URLSearchParams) return clip(value.toString());
    if (target.FormData && value instanceof target.FormData) return clip(JSON.stringify([...value.entries()].map(([k,v]) => [k, typeof v === 'string' ? v : `[文件 ${v.name}, ${v.size} bytes]`])));
    return `[${safe(() => Object.prototype.toString.call(value), '二进制数据')}]`;
  };
  const notify = () => listeners.forEach(fn => safe(() => fn([...records])));
  const begin = (method, url, data, transport) => {
    if (paused || disposed) return null;
    const address = safe(() => String(url));
    if (!address || address.includes('/v1/report')) return null;
    return { id: ++sequence, method: String(method || 'GET').toUpperCase(), url: address, data: body(data), transport, started: Date.now(), generation, token: safe(getToken) };
  };
  const finish = (request, result) => {
    if (!request || request.generation !== generation) return;
    const { token, generation: _, ...metadata } = request;
    const record = { ...metadata, ...result, duration: Date.now() - request.started };
    tokens.set(record, token);
    records.unshift(record);
    if (records.length > maxRecords) records.length = maxRecords;
    notify();
  };
  let proto;
  let originalOpen, originalSend, originalFetch;
  const metadata = new WeakMap();
  function open(method, url) {
    const result = originalOpen.apply(this, arguments);
    safe(() => metadata.set(this, { method, url }));
    return result;
  }
  function send(data) {
    const xhr = this, meta = metadata.get(xhr);
    let request = safe(() => meta && begin(meta.method, meta.url, data, 'XHR'), null);
    let outcome = '完成';
    const failed = event => { outcome = { error: '网络错误', timeout: '超时', abort: '已取消' }[event.type]; };
    const cleanup = () => { pending.delete(cleanup); ['error','timeout','abort'].forEach(t => xhr.removeEventListener(t, failed)); xhr.removeEventListener('loadend', done); };
    const done = () => {
      cleanup();
      safe(() => finish(request, { status: xhr.status, outcome,
        response: !xhr.responseType || xhr.responseType === 'text' ? clip(xhr.responseText) : xhr.responseType === 'json' ? clip(JSON.stringify(xhr.response)) : `[${xhr.responseType} 响应]` }));
    };
    if (request) { pending.add(cleanup); safe(() => { ['error','timeout','abort'].forEach(t => xhr.addEventListener(t, failed)); xhr.addEventListener('loadend', done); }); }
    try { return originalSend.apply(xhr, arguments); } catch (error) { cleanup(); safe(() => finish(request, {status: 0, outcome: '发送失败', response: ''})); throw error; }
  }

  async function readResponse(response) {
    const type = response.headers.get('content-type') || '';
    if (!/json|text|xml|javascript|urlencoded/i.test(type)) return '[非文本响应，未读取]';
    const copy = response.clone();
    if (!copy.body?.getReader) return '[响应流不可读取]';
    const reader = copy.body.getReader(), decoder = new TextDecoder();
    readers.add(reader);
    let text = '', bytes = 0;
    try {
      while (true) {
        const {done, value} = await reader.read();
        if (done) return clip(text + decoder.decode());
        const remaining = maxLength - bytes;
        text += decoder.decode(value.subarray(0, remaining), {stream: true});
        bytes += value.byteLength;
        if (bytes >= maxLength) { reader.cancel().catch(() => {}); return text + '\n[内容已截断]'; }
      }
    } finally { readers.delete(reader); reader.releaseLock(); }
  }
  function fetch(input, init) {
    const request = safe(() => begin(init?.method || input?.method, typeof input === 'string' ? input : input?.url || input, init?.body ?? (input?.body ? '[Request 请求体未读取]' : ''), 'Fetch'), null);
    // Return the original promise and never consume the original response body.
    let promise;
    try { promise = originalFetch.apply(this, arguments); } catch (error) { safe(() => finish(request, { status: 0, outcome: '发送失败', response: '' })); throw error; }
    if (request) promise.then(response => {
      if (disposed || request.generation !== generation) return;
      // Streaming responses must not retain an unbounded clone.
      if (/event-stream/i.test(response.headers.get('content-type') || '')) {
        finish(request, { status: response.status, outcome: '完成', response: '[流式响应，未读取]' }); return;
      }
      readResponse(response).then(text => finish(request, { status: response.status, outcome: '完成', response: text }), () => finish(request, {status: response.status, outcome: '完成', response: '[响应读取失败]'}));
    }, error => safe(() => finish(request, {status: 0, outcome: error?.name === 'AbortError' ? '已取消' : '网络错误', response: ''}))).catch(() => {});
    return promise;
  }
  function retry() {
    if (disposed) return;
    if (status.xhr !== 'ready') {
      try {
        proto = target.XMLHttpRequest?.prototype;
        if (!proto || typeof proto.open !== 'function' || typeof proto.send !== 'function') status.xhr = 'unavailable';
        else {
          originalOpen = proto.open; originalSend = proto.send;
          try {
            proto.open = open; proto.send = send;
            if (proto.open !== open || proto.send !== send) throw new Error('hook rejected');
            status.xhr = 'ready';
          } catch {
            safe(() => { if (proto.open === open) proto.open = originalOpen; });
            safe(() => { if (proto.send === send) proto.send = originalSend; });
            status.xhr = 'failed';
          }
        }
      } catch { status.xhr = 'failed'; }
    }
    if (status.fetch !== 'ready') {
      try {
        originalFetch = target.fetch;
        if (typeof originalFetch !== 'function') status.fetch = 'unavailable';
        else { target.fetch = fetch; status.fetch = target.fetch === fetch ? 'ready' : 'failed'; }
      } catch { status.fetch = 'failed'; }
    }
    report();
  }
  const api = {
    retry,
    getStatus() { return {...status}; },
    subscribe(fn) { listeners.add(fn); fn([...records]); return () => listeners.delete(fn); },
    clear() { generation++; records.length = 0; notify(); },
    setPaused(value) { paused = !!value; },
    getToken(record) { return tokens.get(record) || ''; },
    uninstall() {
      disposed = true; generation++;
      pending.forEach(cleanup => safe(cleanup)); pending.clear();
      readers.forEach(reader => safe(() => reader.cancel().catch(() => {}))); readers.clear();
      safe(() => { if (proto?.open === open) proto.open = originalOpen; });
      safe(() => { if (proto?.send === send) proto.send = originalSend; });
      safe(() => { if (target.fetch === fetch) target.fetch = originalFetch; });
      listeners.clear(); collectors.delete(target);
    }
  };
  collectors.set(target, api);
  retry();
  return api;
}
