export function createRequest(transport, getConfig) {
  return (path, data, { auth = true } = {}) => new Promise((resolve, reject) => {
    const apiKey = getConfig().apiKey;
    if (auth && !apiKey) { reject(new Error('请先在设置中填写 API Key')); return; }
    transport({
      method: 'POST', url: `https://skynjweb.com:7443/dppt/ac-api/support/${path}`,
      headers: { 'Content-Type': 'application/json;charset=UTF-8', ...(auth ? { 'X-API-Key': apiKey } : {}) },
      data: JSON.stringify(data), timeout: 20000,
      onload(response) {
        if (response.status < 200 || response.status >= 300) { reject(new Error(`服务请求失败（HTTP ${response.status}）`)); return; }
        try {
          const result = JSON.parse(response.responseText);
          if (!result || ![0, '0'].includes(result.code)) throw new Error(result?.msg || result?.error || '服务返回失败');
          resolve(result.data);
        } catch (error) { reject(error instanceof SyntaxError ? new Error('服务返回的内容不是有效 JSON') : error); }
      },
      onerror: () => reject(new Error('网络连接失败，请检查服务地址和网络')),
      ontimeout: () => reject(new Error('请求超时，请稍后重试')),
      onabort: () => reject(new Error('请求已取消'))
    });
  });
}
