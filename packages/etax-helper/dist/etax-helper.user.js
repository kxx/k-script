// ==UserScript==
// @name         etax助手
// @namespace    https://github.com/kxx/k-script
// @version      1.1.1
// @author       kxx
// @description  etax小助手
// @license      MIT
// @match        https://*.chinatax.gov.cn/*
// @match        https://*.chinatax.gov.cn:8443/*
// @require      https://cdn.jsdelivr.net/npm/vue@3.5.26/dist/vue.global.prod.js
// @require      data:application/javascript,window.Vue%3DVue%3B
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.7.1/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/element-plus@2.13.1/dist/index.full.min.js
// @resource     element-plus/dist/index.css  https://cdn.bootcdn.net/ajax/libs/element-plus/2.13.1/index.min.css
// @connect      skynjweb.com
// @grant        GM_cookie
// @grant        GM_getResourceText
// @grant        GM_openInTab
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(a=>{const e=document.createElement("style");e.dataset.source="vite-plugin-monkey",e.innerText=a,document.head.appendChild(e)})(" .table-container[data-v-35b354ff],.table-container[data-v-27edb2cf]{display:flex;flex-direction:column;height:100%}.viewDialog span[data-v-27edb2cf]{word-break:normal;width:auto;display:block;white-space:pre-wrap;word-wrap:break-word;overflow:hidden}.k-affix[data-v-c4fbe543]{position:fixed;bottom:15px;padding-left:15px;width:36px;z-index:9999} ");

(function(vue, jquery, elementPlus) {
  "use strict";
  /*! Element Plus Icons Vue v2.3.2 */
  var _sfc_main209 = /* @__PURE__ */ vue.defineComponent({
    name: "Promotion",
    __name: "promotion",
    setup(__props) {
      return (_ctx, _cache) => (vue.openBlock(), vue.createElementBlock("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 1024 1024"
      }, [
        vue.createElementVNode("path", {
          fill: "currentColor",
          d: "m64 448 832-320-128 704-446.08-243.328L832 192 242.816 545.472zm256 512V657.024L512 768z"
        })
      ]));
    }
  }), promotion_default = _sfc_main209;
  var _sfc_main258 = /* @__PURE__ */ vue.defineComponent({
    name: "Switch",
    __name: "switch",
    setup(__props) {
      return (_ctx, _cache) => (vue.openBlock(), vue.createElementBlock("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 1024 1024"
      }, [
        vue.createElementVNode("path", {
          fill: "currentColor",
          d: "M118.656 438.656a32 32 0 0 1 0-45.248L416 96l4.48-3.776A32 32 0 0 1 461.248 96l3.712 4.48a32.064 32.064 0 0 1-3.712 40.832L218.56 384H928a32 32 0 1 1 0 64H141.248a32 32 0 0 1-22.592-9.344M64 608a32 32 0 0 1 32-32h786.752a32 32 0 0 1 22.656 54.592L608 928l-4.48 3.776a32.064 32.064 0 0 1-40.832-49.024L805.632 640H96a32 32 0 0 1-32-32"
        })
      ]));
    }
  }), switch_default = _sfc_main258;
  const cssLoader = (e) => {
    const t = GM_getResourceText(e), o = document.createElement("style");
    return o.innerText = t, document.head.append(o), t;
  };
  cssLoader("element-plus/dist/index.css");
  var monkeyWindow = window;
  var GM_openInTab = /* @__PURE__ */ (() => monkeyWindow.GM_openInTab)();
  var GM_xmlhttpRequest = /* @__PURE__ */ (() => monkeyWindow.GM_xmlhttpRequest)();
  class Store {
    constructor() {
      this.prefix = "etax_helper_";
    }
    getEtax(key = "") {
      let item = localStorage.getItem(key);
      if (!item) {
        return "";
      }
      try {
        return JSON.parse(item);
      } catch (e) {
        return item;
      }
    }
    getItem(key = "") {
      return this.getEtax(this.prefix + key);
    }
    setItem(key = "", value) {
      localStorage.setItem(this.prefix + key, value instanceof Object ? JSON.stringify(value) : value);
    }
    removeItem(key) {
      if (key == null || key == "") {
        return;
      }
      localStorage.removeItem(this.prefix + key);
    }
    getCookies() {
      var cookieObj = {};
      var cookieStr = document.cookie;
      var cookieList = cookieStr.split(";");
      for (const cookie of cookieList) {
        let _c = cookie.trim().split("=");
        cookieObj[_c[0]] = _c[1];
      }
      return cookieObj;
    }
    getCookie(key = "") {
      var cookieObj = this.getCookies();
      return cookieObj[key];
    }
  }
  const store = new Store();
  const supportService = {
    baseUrl: "https://skynjweb.com:7443/dppt/ac-api/support",
    async getAccount(params) {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "POST",
          url: `${this.baseUrl}/getAccount`,
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            "X-API-Key": store.getItem("config").apiKey || ""
          },
          data: JSON.stringify(params),
          onload: function(response) {
            resolve(response.responseText);
          },
          onerror: function(response) {
            reject(response.statusText);
          }
        });
      });
    },
    async getCookie(params) {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "POST",
          url: `${this.baseUrl}/getCookie`,
          headers: {
            "Content-Type": "application/json;charset=UTF-8",
            "X-API-Key": store.getItem("config").apiKey || ""
          },
          data: JSON.stringify(params),
          onload: function(response) {
            resolve(response.responseText);
          },
          onerror: function(response) {
            reject(response.statusText);
          }
        });
      });
    },
    async decryptJmbw(params) {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "POST",
          url: `${this.baseUrl}/decryptJmbw`,
          headers: {
            "Content-Type": "application/json;charset=UTF-8"
          },
          data: JSON.stringify(params),
          onload: function(response) {
            resolve(response.responseText);
          },
          onerror: function(response) {
            reject(response.statusText);
          }
        });
      });
    }
  };
  const initPath = "/";
  const initDomain = ".chinatax.gov.cn";
  let setDpptCookie = (params) => {
    try {
      setCookieByDocument("SSO_SECURITY_CHECK_TOKEN", params.checkToken, "", initPath, initDomain, true);
      setCookieByDocument("dzfp-ssotoken", params.dzfpToken, "", initPath, initDomain, true);
      setCookieByDocument("security-token-key", "dzfp-ssotoken", "", initPath, initDomain, false);
    } catch {
    }
  };
  let setEtaxCookie = (params) => {
    let clientId = localStorage.clientId || "";
    let name = "tpass_" + clientId;
    setCookieByDocument(name, params.tpassToken, "", initPath, initDomain, false);
  };
  let setCookieByDocument = (name, value, expires, path, domain, secure) => {
    var cookieText = encodeURIComponent(name) + "=" + encodeURIComponent(value);
    if (expires instanceof Date) {
      cookieText += "; expires=" + expires;
    }
    if (path) {
      cookieText += "; path=" + path;
    }
    if (domain) {
      cookieText += "; domain=" + domain;
    }
    if (secure) {
      cookieText += "; secure";
    }
    document.cookie = cookieText;
    console.log("Cookie set successfully : " + name);
  };
  const Account_vue_vue_type_style_index_0_scoped_35b354ff_lang = "";
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _hoisted_1$3 = { class: "table-container" };
  const _sfc_main$3 = {
    __name: "Account",
    setup(__props) {
      const search = vue.ref("");
      const areaName = vue.ref("");
      const tableRef = vue.ref(null);
      const tableData = vue.ref([]);
      const formRef = vue.ref(null);
      const cookieForm = vue.reactive({
        area: "",
        tpassToken: "",
        checkToken: "",
        dzfpToken: "",
        platform: "home"
      });
      const rules = {
        tpassToken: [{ required: true, message: "TpassToken不能为空", trigger: "blur" }],
        checkToken: [{ required: true, message: "CheckToken不能为空", trigger: "blur" }],
        dzfpToken: [{ required: true, message: "DzfpToken不能为空", trigger: "blur" }]
      };
      vue.onMounted(() => {
        initParams();
        handleFilter();
      });
      const initParams = () => {
        let url = window.location.href || "";
        areaName.value = (url.match(/\.(.*?)\./) || [])[1] || "";
        cookieForm.area = areaName.value;
      };
      async function handleFilter() {
        const apiKey = store.getItem("config").apiKey || "";
        if (apiKey === "") {
          return;
        }
        const result = JSON.parse(await supportService.getAccount({ areaName: areaName.value }));
        if (result.code == 0) {
          tableData.value = result.data.workspaces;
        } else {
          console.log(result.msg || result.error);
        }
      }
      async function onSubmit() {
        formRef.value.validate((valid) => {
          if (!valid) {
            return;
          }
          switch (cookieForm.platform) {
            case "home":
            case "zhcx":
            case "ckts":
              setEtaxCookie(vue.toRaw(cookieForm));
              openEtaxPage(cookieForm.platform);
              break;
            case "dppt":
              setDpptCookie(vue.toRaw(cookieForm));
              openDpptPage(cookieForm.platform);
              break;
          }
        });
      }
      const resetForm = () => {
        formRef.value.resetFields();
      };
      async function handleAuth(row, ptdm) {
        const result = JSON.parse(await supportService.getCookie(row.cookieId));
        if (result.code == 0)
          ;
        else {
          console.log(result.msg || result.error);
        }
      }
      const openEtaxPage = (ptdm) => {
        let url = "https://etax." + areaName.value + ".chinatax.gov.cn:8443/loginb/";
        GM_openInTab(url, { active: true });
      };
      const openDpptPage = (ptdm) => {
        let url = "https://dppt." + areaName.value + ".chinatax.gov.cn:8443/invoice-business";
        GM_openInTab(url, { active: true });
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$3, [
          vue.createVNode(vue.unref(elementPlus.ElTable), {
            ref_key: "tableRef",
            ref: tableRef,
            data: tableData.value,
            height: "100%",
            size: "small"
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(vue.unref(elementPlus.ElTableColumn), {
                prop: "name",
                label: "税号"
              }),
              vue.createVNode(vue.unref(elementPlus.ElTableColumn), {
                prop: "name2",
                label: "名称"
              }),
              vue.createVNode(vue.unref(elementPlus.ElTableColumn), {
                prop: "name3",
                label: "用户"
              }),
              vue.createVNode(vue.unref(elementPlus.ElTableColumn), {
                prop: "name3",
                label: "状态"
              }),
              vue.createVNode(vue.unref(elementPlus.ElTableColumn), {
                prop: "op",
                width: "100px"
              }, {
                header: vue.withCtx(() => [
                  vue.createVNode(vue.unref(elementPlus.ElInput), {
                    modelValue: search.value,
                    "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => search.value = $event),
                    size: "small",
                    placeholder: "nsrsbh、cookieId"
                  }, null, 8, ["modelValue"])
                ]),
                default: vue.withCtx((scope) => [
                  vue.createVNode(vue.unref(elementPlus.ElButton), {
                    size: "small",
                    text: ""
                  }, {
                    default: vue.withCtx(() => [..._cache[5] || (_cache[5] = [
                      vue.createTextVNode("校验", -1)
                    ])]),
                    _: 1
                  }),
                  vue.createVNode(vue.unref(elementPlus.ElButton), {
                    size: "small",
                    text: "",
                    type: "danger",
                    onClick: vue.withModifiers(($event) => handleAuth(scope.row), ["prevent"])
                  }, {
                    default: vue.withCtx(() => [..._cache[6] || (_cache[6] = [
                      vue.createTextVNode("DTA", -1)
                    ])]),
                    _: 1
                  }, 8, ["onClick"]),
                  vue.createVNode(vue.unref(elementPlus.ElButton), {
                    size: "small",
                    text: "",
                    type: "danger",
                    onClick: vue.withModifiers(($event) => handleAuth(scope.row), ["prevent"])
                  }, {
                    default: vue.withCtx(() => [..._cache[7] || (_cache[7] = [
                      vue.createTextVNode("BIM", -1)
                    ])]),
                    _: 1
                  }, 8, ["onClick"]),
                  vue.createVNode(vue.unref(elementPlus.ElButton), {
                    size: "small",
                    text: "",
                    type: "danger",
                    onClick: vue.withModifiers(($event) => handleAuth(scope.row), ["prevent"])
                  }, {
                    default: vue.withCtx(() => [..._cache[8] || (_cache[8] = [
                      vue.createTextVNode("RIM", -1)
                    ])]),
                    _: 1
                  }, 8, ["onClick"])
                ]),
                _: 1
              })
            ]),
            _: 1
          }, 8, ["data"]),
          vue.createVNode(vue.unref(elementPlus.ElPopover), {
            placement: "top",
            width: 600,
            trigger: "click"
          }, {
            reference: vue.withCtx(() => [
              vue.createVNode(vue.unref(elementPlus.ElButton), {
                class: "mt-1",
                style: { "margin-top": "6px" }
              }, {
                default: vue.withCtx(() => [..._cache[9] || (_cache[9] = [
                  vue.createTextVNode("手动登录", -1)
                ])]),
                _: 1
              })
            ]),
            default: vue.withCtx(() => [
              vue.createVNode(vue.unref(elementPlus.ElForm), {
                ref_key: "formRef",
                ref: formRef,
                model: cookieForm,
                rules,
                "label-width": "100px",
                size: "small"
              }, {
                default: vue.withCtx(() => [
                  ["home", "zhcx", "ckts"].includes(cookieForm.platform) ? (vue.openBlock(), vue.createBlock(vue.unref(elementPlus.ElFormItem), {
                    key: 0,
                    label: "TpassToken",
                    prop: "tpassToken"
                  }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(vue.unref(elementPlus.ElInput), {
                        modelValue: cookieForm.tpassToken,
                        "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => cookieForm.tpassToken = $event)
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  })) : vue.createCommentVNode("", true),
                  ["dppt"].includes(cookieForm.platform) ? (vue.openBlock(), vue.createBlock(vue.unref(elementPlus.ElFormItem), {
                    key: 1,
                    label: "CheckToken",
                    prop: "checkToken"
                  }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(vue.unref(elementPlus.ElInput), {
                        modelValue: cookieForm.checkToken,
                        "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => cookieForm.checkToken = $event)
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  })) : vue.createCommentVNode("", true),
                  ["dppt"].includes(cookieForm.platform) ? (vue.openBlock(), vue.createBlock(vue.unref(elementPlus.ElFormItem), {
                    key: 2,
                    label: "DzfpToken",
                    prop: "dzfpToken"
                  }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(vue.unref(elementPlus.ElInput), {
                        modelValue: cookieForm.dzfpToken,
                        "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => cookieForm.dzfpToken = $event)
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  })) : vue.createCommentVNode("", true),
                  vue.createVNode(vue.unref(elementPlus.ElFormItem), {
                    label: "Platform",
                    prop: "platform"
                  }, {
                    default: vue.withCtx(() => [
                      vue.createVNode(vue.unref(elementPlus.ElRadioGroup), {
                        "radio-group": "",
                        modelValue: cookieForm.platform,
                        "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => cookieForm.platform = $event)
                      }, {
                        default: vue.withCtx(() => [
                          vue.createVNode(vue.unref(elementPlus.ElRadioButton), { label: "home" }, {
                            default: vue.withCtx(() => [..._cache[10] || (_cache[10] = [
                              vue.createTextVNode("新版首页", -1)
                            ])]),
                            _: 1
                          }),
                          vue.createVNode(vue.unref(elementPlus.ElRadioButton), { label: "dppt" }, {
                            default: vue.withCtx(() => [..._cache[11] || (_cache[11] = [
                              vue.createTextVNode("发票业务", -1)
                            ])]),
                            _: 1
                          }),
                          vue.createVNode(vue.unref(elementPlus.ElRadioButton), { label: "zhcx" }, {
                            default: vue.withCtx(() => [..._cache[12] || (_cache[12] = [
                              vue.createTextVNode("账户查询", -1)
                            ])]),
                            _: 1
                          }),
                          vue.createVNode(vue.unref(elementPlus.ElRadioButton), { label: "ckts" }, {
                            default: vue.withCtx(() => [..._cache[13] || (_cache[13] = [
                              vue.createTextVNode("退税管理", -1)
                            ])]),
                            _: 1
                          })
                        ]),
                        _: 1
                      }, 8, ["modelValue"])
                    ]),
                    _: 1
                  }),
                  vue.createVNode(vue.unref(elementPlus.ElFormItem), null, {
                    default: vue.withCtx(() => [
                      vue.createVNode(vue.unref(elementPlus.ElButton), {
                        type: "primary",
                        onClick: onSubmit
                      }, {
                        default: vue.withCtx(() => [..._cache[14] || (_cache[14] = [
                          vue.createTextVNode("确定", -1)
                        ])]),
                        _: 1
                      }),
                      vue.createVNode(vue.unref(elementPlus.ElButton), { onClick: resetForm }, {
                        default: vue.withCtx(() => [..._cache[15] || (_cache[15] = [
                          vue.createTextVNode("重置", -1)
                        ])]),
                        _: 1
                      })
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              }, 8, ["model"])
            ]),
            _: 1
          })
        ]);
      };
    }
  };
  const Account = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-35b354ff"]]);
  var message = null;
  let showMessge = function(option) {
    try {
      message.close();
    } catch {
    }
    message = elementPlus.ElMessage(option);
  };
  let showError = function(msg, timeout) {
    showMessge({
      message: msg,
      type: "error",
      duration: timeout || 3e3
    });
  };
  const Network_vue_vue_type_style_index_0_scoped_27edb2cf_lang = "";
  const _hoisted_1$2 = { class: "table-container" };
  const _sfc_main$2 = {
    __name: "Network",
    setup(__props) {
      const tableData = vue.ref([]);
      const dialogVisible = vue.ref(false);
      const viewTitle = vue.ref("");
      const viewContent = vue.ref("");
      const dzfpSsotoken = vue.ref("");
      vue.onMounted(() => {
        xhrListener();
        dzfpSsotoken.value = store.getCookie("dzfp-ssotoken");
      });
      function xhrListener() {
        monkeyWindow.m_log = monkeyWindow.console.log;
        monkeyWindow.m_log("开启请求监听");
        const originalXhrOpen = monkeyWindow.XMLHttpRequest.prototype.open;
        monkeyWindow.XMLHttpRequest.prototype.open = function(method, url) {
          const xhr = this;
          const originalXhrSend = xhr.send;
          xhr.send = function(data) {
            const requestData = {
              method,
              url,
              data,
              date: (/* @__PURE__ */ new Date()).toLocaleTimeString()
            };
            xhr.addEventListener("load", function() {
              const responseData = {
                status: xhr.status,
                response: xhr.responseText
              };
              insertRequest(Object.assign({}, requestData, responseData));
            });
            originalXhrSend.call(xhr, data);
          };
          originalXhrOpen.apply(this, arguments);
        };
      }
      function insertRequest(request) {
        if (!request || request.url.includes("/v1/report"))
          return;
        tableData.value.unshift(request);
        if (tableData.value.length > 50) {
          tableData.value.pop();
        }
      }
      function urlFormatter(row, column, cellValue, index) {
        return cellValue.split("?")[0];
      }
      async function viewRequest(row) {
        viewTitle.value = "负载";
        viewContent.value = "";
        dialogVisible.value = true;
        let rowObj = vue.toRaw(row);
        if (rowObj && rowObj.deData) {
          viewContent.value = rowObj.deData;
          return;
        }
        if (rowObj && rowObj.data && rowObj.data.includes("Jmbw")) {
          let params = {};
          params.url = row.url.split("?")[0];
          params.token = dzfpSsotoken.value;
          params.jmbw = JSON.parse(row.data)["Jmbw"];
          let res = await supportService.decryptJmbw(params);
          const result = JSON.parse(res);
          if (result.code == 0) {
            viewContent.value = result.data.params;
            row.deData = result.data.params;
          } else {
            showError(result.msg || result.error);
          }
        } else {
          viewContent.value = row.data;
        }
      }
      function viewResponse(row) {
        viewTitle.value = "响应";
        viewContent.value = JSON.parse(row.response);
        dialogVisible.value = true;
      }
      function handleClear() {
        tableData.value = [];
      }
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$2, [
          vue.createVNode(vue.unref(elementPlus.ElTable), {
            ref: "netWorkRef",
            data: tableData.value,
            "highlight-current-row": "",
            height: "100%",
            size: "small"
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(vue.unref(elementPlus.ElTableColumn), {
                type: "index",
                width: "50"
              }),
              vue.createVNode(vue.unref(elementPlus.ElTableColumn), {
                prop: "url",
                label: "接口",
                formatter: urlFormatter
              }),
              vue.createVNode(vue.unref(elementPlus.ElTableColumn), {
                prop: "method",
                label: "方法",
                width: "70"
              }),
              vue.createVNode(vue.unref(elementPlus.ElTableColumn), {
                prop: "status",
                label: "状态",
                width: "60"
              }),
              vue.createVNode(vue.unref(elementPlus.ElTableColumn), {
                fixed: "right",
                label: "操作",
                width: "100"
              }, {
                default: vue.withCtx((scope) => [
                  vue.createVNode(vue.unref(elementPlus.ElButton), {
                    link: "",
                    type: "primary",
                    size: "small",
                    onClick: ($event) => viewRequest(scope.row)
                  }, {
                    default: vue.withCtx(() => [..._cache[1] || (_cache[1] = [
                      vue.createTextVNode("参数", -1)
                    ])]),
                    _: 1
                  }, 8, ["onClick"]),
                  vue.createVNode(vue.unref(elementPlus.ElButton), {
                    link: "",
                    type: "primary",
                    size: "small",
                    onClick: ($event) => viewResponse(scope.row)
                  }, {
                    default: vue.withCtx(() => [..._cache[2] || (_cache[2] = [
                      vue.createTextVNode("响应", -1)
                    ])]),
                    _: 1
                  }, 8, ["onClick"])
                ]),
                _: 1
              })
            ]),
            _: 1
          }, 8, ["data"]),
          vue.createVNode(vue.unref(elementPlus.ElButton), {
            class: "mt-4",
            style: { "margin-top": "6px" },
            onClick: handleClear
          }, {
            default: vue.withCtx(() => [..._cache[3] || (_cache[3] = [
              vue.createTextVNode("清空", -1)
            ])]),
            _: 1
          }),
          vue.createVNode(vue.unref(elementPlus.ElDialog), {
            modelValue: dialogVisible.value,
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => dialogVisible.value = $event),
            title: viewTitle.value,
            "close-on-click-modal": false,
            width: "35%",
            class: "viewDialog"
          }, {
            default: vue.withCtx(() => [
              vue.createElementVNode("span", null, vue.toDisplayString(viewContent.value), 1)
            ]),
            _: 1
          }, 8, ["modelValue", "title"])
        ]);
      };
    }
  };
  const Network = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-27edb2cf"]]);
  const _hoisted_1$1 = { style: { "flex": "auto" } };
  const _sfc_main$1 = {
    __name: "Home",
    setup(__props) {
      const drawerVisible = vue.ref(false);
      const direction = vue.ref("rtl");
      const componentRef = vue.ref();
      const componentName = vue.ref(null);
      vue.onMounted(() => {
        if (window.location.href.startsWith("https://tpass.") || window.location.href.startsWith("https://etax.")) {
          componentName.value = vue.markRaw(Account);
        } else {
          componentName.value = vue.markRaw(Network);
        }
      });
      const showDrawer = () => {
        drawerVisible.value = true;
      };
      const changeMode = () => {
        if (componentName.value == vue.markRaw(Account)) {
          componentName.value = vue.markRaw(Network);
        } else if (componentName.value == vue.markRaw(Network)) {
          componentName.value = vue.markRaw(Account);
        }
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock(vue.Fragment, null, [
          vue.createVNode(vue.unref(elementPlus.ElAffix), {
            offset: 120,
            target: "body"
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(vue.unref(elementPlus.ElButton), {
                type: "primary",
                icon: vue.unref(promotion_default),
                circle: "",
                onClick: showDrawer
              }, null, 8, ["icon"])
            ]),
            _: 1
          }),
          vue.createVNode(vue.unref(elementPlus.ElDrawer), {
            modelValue: drawerVisible.value,
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => drawerVisible.value = $event),
            direction: direction.value,
            "with-header": false,
            size: "50%",
            "append-to-body": true
          }, {
            footer: vue.withCtx(() => [
              vue.createElementVNode("div", _hoisted_1$1, [
                vue.createVNode(vue.unref(elementPlus.ElButton), {
                  type: "info",
                  icon: vue.unref(switch_default),
                  size: "small",
                  plain: "",
                  onClick: changeMode
                }, {
                  default: vue.withCtx(() => [..._cache[1] || (_cache[1] = [
                    vue.createTextVNode("模式", -1)
                  ])]),
                  _: 1
                }, 8, ["icon"])
              ])
            ]),
            default: vue.withCtx(() => [
              (vue.openBlock(), vue.createBlock(vue.resolveDynamicComponent(componentName.value), {
                ref_key: "componentRef",
                ref: componentRef
              }, null, 512))
            ]),
            _: 1
          }, 8, ["modelValue", "direction"])
        ], 64);
      };
    }
  };
  const App_vue_vue_type_style_index_0_scoped_c4fbe543_lang = "";
  const _hoisted_1 = { class: "k-affix" };
  const _sfc_main = {
    __name: "App",
    setup(__props) {
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1, [
          vue.createVNode(_sfc_main$1)
        ]);
      };
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-c4fbe543"]]);
  vue.createApp(App).mount(
    (() => {
      const app = document.createElement("div");
      app.id = "etax-helper";
      document.body.append(app);
      return app;
    })()
  );
})(Vue, $, ElementPlus);
