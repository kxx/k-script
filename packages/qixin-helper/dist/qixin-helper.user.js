// ==UserScript==
// @name         Qx助手
// @namespace    https://github.com/kxx/k-script
// @version      1.0.0
// @author       kxx
// @description  企信小助手
// @license      MIT
// @match        https://www.qixin.com
// @match        https://www.qixin.com/*
// @match        https://qixin.com
// @match        qixin.com
// @match        kxx.me
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

(a=>{const e=document.createElement("style");e.dataset.source="vite-plugin-monkey",e.innerText=a,document.head.appendChild(e)})(" .table-container[data-v-d21d59a9],.table-container[data-v-27edb2cf]{display:flex;flex-direction:column;height:100%}.viewDialog span[data-v-27edb2cf]{word-break:normal;width:auto;display:block;white-space:pre-wrap;word-wrap:break-word;overflow:hidden}.k-affix[data-v-de5e7b8c]{position:fixed;bottom:55px;padding-left:15px;width:36px;z-index:99999} ");

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
  const Account_vue_vue_type_style_index_0_scoped_d21d59a9_lang = "";
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  const _hoisted_1$1 = { class: "table-container" };
  const _sfc_main$2 = {
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
        return vue.openBlock(), vue.createElementBlock("div", _hoisted_1$1, [
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
                  vue.createTextVNode("下 载", -1)
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
                          vue.createVNode(vue.unref(elementPlus.ElRadioButton), { value: "home" }, {
                            default: vue.withCtx(() => [..._cache[10] || (_cache[10] = [
                              vue.createTextVNode("新版首页", -1)
                            ])]),
                            _: 1
                          }),
                          vue.createVNode(vue.unref(elementPlus.ElRadioButton), { value: "dppt" }, {
                            default: vue.withCtx(() => [..._cache[11] || (_cache[11] = [
                              vue.createTextVNode("发票业务", -1)
                            ])]),
                            _: 1
                          }),
                          vue.createVNode(vue.unref(elementPlus.ElRadioButton), { value: "zhcx" }, {
                            default: vue.withCtx(() => [..._cache[12] || (_cache[12] = [
                              vue.createTextVNode("账户查询", -1)
                            ])]),
                            _: 1
                          }),
                          vue.createVNode(vue.unref(elementPlus.ElRadioButton), { value: "ckts" }, {
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
  const Account = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-d21d59a9"]]);
  const Network_vue_vue_type_style_index_0_scoped_27edb2cf_lang = "";
  const _sfc_main$1 = {
    __name: "Home",
    setup(__props) {
      const drawerVisible = vue.ref(false);
      const direction = vue.ref("rtl");
      const componentRef = vue.ref();
      const componentName = vue.ref(null);
      vue.onMounted(() => {
        componentName.value = vue.markRaw(Account);
      });
      const showDrawer = () => {
        drawerVisible.value = true;
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
  const App_vue_vue_type_style_index_0_scoped_de5e7b8c_lang = "";
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
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-de5e7b8c"]]);
  vue.createApp(App).mount(
    (() => {
      const app = document.createElement("div");
      document.body.append(app);
      return app;
    })()
  );
})(Vue, $, ElementPlus);
