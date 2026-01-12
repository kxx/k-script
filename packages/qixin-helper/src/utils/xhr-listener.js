import { monkeyWindow } from '$';

const XhrListener = {
  install(app, options) {
    debugger
    monkeyWindow.m_log = monkeyWindow.console.log;
    monkeyWindow.m_log('开启请求监听');

    // 存储请求记录的数组
    const requests = [];

    // 保存原始的 XMLHttpRequest
    const originalXHR = monkeyWindow.XMLHttpRequest;

    // 创建新的 XMLHttpRequest 拦截器
    monkeyWindow.XMLHttpRequest = function () {
    
      const xhr = new originalXHR();

      xhr.addEventListener('load', function () {
        const requestInfo = {
          method: xhr._method || 'GET',
          url: xhr._url || '',
          data: xhr._data || null,
          response: xhr.responseText,
        };

        monkeyWindow.m_log('Request Data:', requestInfo);
        requests.push(requestInfo);
    
      });

      return xhr;
    };

    // 暴露插件API
    app.config.globalProperties.$xhrhrListener = {
      getRequests: () => requests,
      clearRequests: () => requests.splice(0, requests.length),
    };
  },
};

export default XhrListener;

