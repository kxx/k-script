// ==UserScript==
// @name         showdoc助手
// @namespace    https://github.com/kxx/k-script
// @version      1.0.0
// @author       kxx
// @description  支持同步postman接口到showdoc
// @license      MIT
// @icon         https://img.alicdn.com/imgextra/i1/O1CN01JDQCi21Dc8EfbRwvF_!!6000000000236-73-tps-64-64.ico
// @match        https://apidoc.chinackts.com/*
// @require      https://cdn.jsdelivr.net/npm/vue@3.5.26/dist/vue.global.prod.js
// @require      data:application/javascript,window.Vue%3DVue%3B
// @require      https://cdn.bootcdn.net/ajax/libs/jquery/3.7.1/jquery.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/axios/1.13.2/axios.min.js
// @require      https://cdn.jsdelivr.net/npm/element-plus@2.13.1/dist/index.full.min.js
// @resource     element-plus/dist/index.css  https://cdn.bootcdn.net/ajax/libs/element-plus/2.13.1/index.min.css
// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==

(e=>{if(typeof GM_addStyle=="function"){GM_addStyle(e);return}const t=document.createElement("style");t.textContent=e,document.head.append(t)})(" .demo-form-inline .el-input{--el-input-width: 220px} ");

(function (vue, $, elementPlus, axios) {
  'use strict';

  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };
  /*! Element Plus Icons Vue v2.3.2 */
  var _sfc_main231 = /* @__PURE__ */ vue.defineComponent({
    name: "Setting",
    __name: "setting",
    setup(__props) {
      return (_ctx, _cache) => (vue.openBlock(), vue.createElementBlock("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 1024 1024"
      }, [
        vue.createElementVNode("path", {
          fill: "currentColor",
          d: "M600.704 64a32 32 0 0 1 30.464 22.208l35.2 109.376c14.784 7.232 28.928 15.36 42.432 24.512l112.384-24.192a32 32 0 0 1 34.432 15.36L944.32 364.8a32 32 0 0 1-4.032 37.504l-77.12 85.12a357 357 0 0 1 0 49.024l77.12 85.248a32 32 0 0 1 4.032 37.504l-88.704 153.6a32 32 0 0 1-34.432 15.296L708.8 803.904c-13.44 9.088-27.648 17.28-42.368 24.512l-35.264 109.376A32 32 0 0 1 600.704 960H423.296a32 32 0 0 1-30.464-22.208L357.696 828.48a352 352 0 0 1-42.56-24.64l-112.32 24.256a32 32 0 0 1-34.432-15.36L79.68 659.2a32 32 0 0 1 4.032-37.504l77.12-85.248a357 357 0 0 1 0-48.896l-77.12-85.248A32 32 0 0 1 79.68 364.8l88.704-153.6a32 32 0 0 1 34.432-15.296l112.32 24.256c13.568-9.152 27.776-17.408 42.56-24.64l35.2-109.312A32 32 0 0 1 423.232 64H600.64zm-23.424 64H446.72l-36.352 113.088-24.512 11.968a294 294 0 0 0-34.816 20.096l-22.656 15.36-116.224-25.088-65.28 113.152 79.68 88.192-1.92 27.136a293 293 0 0 0 0 40.192l1.92 27.136-79.808 88.192 65.344 113.152 116.224-25.024 22.656 15.296a294 294 0 0 0 34.816 20.096l24.512 11.968L446.72 896h130.688l36.48-113.152 24.448-11.904a288 288 0 0 0 34.752-20.096l22.592-15.296 116.288 25.024 65.28-113.152-79.744-88.192 1.92-27.136a293 293 0 0 0 0-40.256l-1.92-27.136 79.808-88.128-65.344-113.152-116.288 24.96-22.592-15.232a288 288 0 0 0-34.752-20.096l-24.448-11.904L577.344 128zM512 320a192 192 0 1 1 0 384 192 192 0 0 1 0-384m0 64a128 128 0 1 0 0 256 128 128 0 0 0 0-256"
        })
      ]));
    }
  }), setting_default = _sfc_main231;
  const cssLoader = (e) => {
    const t = GM_getResourceText(e);
    return GM_addStyle(t), t;
  };
  cssLoader("element-plus/dist/index.css");
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
  let showSuccess = function(msg, timeout) {
    showMessge({
      message: msg,
      type: "success",
      duration: timeout || 3e3
    });
  };
  class Store {
    constructor() {
      this.prefix = "showdoc_";
    }
    getShowdoc(key = "") {
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
      return this.getShowdoc(this.prefix + key);
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
  }
  const store = new Store();
  const _Result = class _Result {
    constructor(type, msg, data) {
      __publicField(this, "type");
      __publicField(this, "msg");
      __publicField(this, "data");
      this.type = type;
      this.msg = msg;
      this.data = data;
    }
    isSuccess() {
      return _Result.SUCCESS === this.type;
    }
    isError() {
      return _Result.ERROR === this.type;
    }
    static success(msg) {
      return this.builder().type(_Result.SUCCESS).msg(msg);
    }
    static warning(msg) {
      return this.builder().type(_Result.WARNING).msg(msg);
    }
    static error(msg) {
      return this.builder().type(_Result.ERROR).msg(msg);
    }
    static info(msg) {
      return this.builder().type(_Result.INFO).msg(msg);
    }
    static builder() {
      return {
        type(type) {
          this.typeParam = type;
          return this;
        },
        msg(msg) {
          this.msgParam = msg;
          return this;
        },
        data(data) {
          this.dataParam = data;
          return this;
        },
        build() {
          return new _Result(this.typeParam, this.msgParam, this.dataParam);
        }
      };
    }
  };
  __publicField(_Result, "SUCCESS", "success");
  __publicField(_Result, "WARNING", "warning");
  __publicField(_Result, "ERROR", "error");
  __publicField(_Result, "INFO", "info");
  let Result = _Result;
  const showdocService = {
    baseUrl: "https://apidoc.chinackts.com/server/index.php",
    async getAllItems(params) {
      try {
        const response = await axios.post(`${this.baseUrl}?s=/api/item/myList`, params);
        return Result.success("成功").data(response.data).build();
      } catch (e) {
        return Result.error("失败：" + e.message).build();
      }
    },
    async getAItem(params) {
      try {
        const response = await axios.post(`${this.baseUrl}?s=/api/item/info`, params);
        return Result.success("成功").data(response.data).build();
      } catch (e) {
        return Result.error("失败：" + e.message).build();
      }
    },
    async getItemByName(itemName = "") {
      var _a;
      try {
        const response = await axios.post(`${this.baseUrl}?s=/api/item/myList`, {});
        let item = itemName == "" ? null : (_a = response.data.data) == null ? void 0 : _a.find((item2) => item2.item_name === itemName);
        return Result.success("成功").data(item).build();
      } catch (e) {
        return Result.error("失败：" + e.message).build();
      }
    },
    async addItem(params) {
      try {
        const response = await axios.post(`${this.baseUrl}?s=/api/item/add`, params);
        return Result.success("成功").data(response.data).build();
      } catch (e) {
        return Result.error("失败：" + e.message).build();
      }
    },
    async getItemKey(params) {
      try {
        const response = await axios.post(`${this.baseUrl}?s=/api/item/getKey`, params);
        return Result.success("成功").data(response.data).build();
      } catch (e) {
        return Result.error("失败：" + e.message).build();
      }
    },
    async updateByApi(params) {
      try {
        const response = await axios.post(`${this.baseUrl}?s=/api/item/updateByApi`, params);
        return Result.success("成功").data(response.data).build();
      } catch (e) {
        return Result.error("失败：" + e.message).build();
      }
    },
    async getTemplates() {
      try {
        const response = await axios.post(`${this.baseUrl}?s=/api/template/getMyList`, null);
        return Result.success("成功").data(response.data).build();
      } catch (e) {
        return Result.error("失败：" + e.message).build();
      }
    }
  };
  const _sfc_main$3 = {
    __name: "Config",
    setup(__props) {
      const configForm = vue.reactive({
        apiKey: "",
        templateId: "",
        sameCatalog: false
      });
      const templateOptions = vue.ref([]);
      vue.onMounted(() => {
        initConfig();
      });
      async function initConfig() {
        let config = store.getItem("config");
        configForm.apiKey = config.apiKey || "";
        configForm.templateId = config.templateId || "";
        configForm.sameCatalog = config.sameCatalog || false;
        let result = await showdocService.getTemplates();
        if (result.isSuccess()) {
          templateOptions.value = result.data.data;
        }
      }
      const saveConfig = () => {
        let used_template = "";
        let template = templateOptions.value.find((item) => item.id == configForm.templateId);
        if (template) {
          used_template = template.template_content;
        }
        store.setItem("used_template", used_template);
        store.setItem("config", vue.toRaw(configForm));
        showSuccess("配置保存成功");
      };
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createBlock(vue.unref(elementPlus.ElForm), {
          model: configForm,
          "label-width": "116px",
          "label-position": "left",
          class: "demo-form-inline"
        }, {
          default: vue.withCtx(() => [
            vue.createVNode(vue.unref(elementPlus.ElFormItem), { label: "API Key" }, {
              default: vue.withCtx(() => [
                vue.createVNode(vue.unref(elementPlus.ElInput), {
                  modelValue: configForm.apiKey,
                  "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => configForm.apiKey = $event)
                }, null, 8, ["modelValue"])
              ]),
              _: 1
            }),
            vue.createVNode(vue.unref(elementPlus.ElFormItem), { label: "文档模板" }, {
              default: vue.withCtx(() => [
                vue.createVNode(vue.unref(elementPlus.ElSelect), {
                  modelValue: configForm.templateId,
                  "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => configForm.templateId = $event),
                  placeholder: "请选择模板"
                }, {
                  default: vue.withCtx(() => [
                    (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(templateOptions.value, (item) => {
                      return vue.openBlock(), vue.createBlock(vue.unref(elementPlus.ElOption), {
                        key: item.id,
                        value: item.id,
                        label: item.template_title
                      }, null, 8, ["value", "label"]);
                    }), 128))
                  ]),
                  _: 1
                }, 8, ["modelValue"])
              ]),
              _: 1
            }),
            vue.createVNode(vue.unref(elementPlus.ElFormItem), { label: "不同步目录" }, {
              default: vue.withCtx(() => [
                vue.createVNode(vue.unref(elementPlus.ElSwitch), {
                  modelValue: configForm.sameCatalog,
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => configForm.sameCatalog = $event)
                }, null, 8, ["modelValue"])
              ]),
              _: 1
            }),
            vue.createVNode(vue.unref(elementPlus.ElFormItem), null, {
              default: vue.withCtx(() => [
                vue.createVNode(vue.unref(elementPlus.ElButton), null, {
                  default: vue.withCtx(() => [..._cache[3] || (_cache[3] = [
                    vue.createTextVNode("取消", -1)
                  ])]),
                  _: 1
                }),
                vue.createVNode(vue.unref(elementPlus.ElButton), {
                  type: "primary",
                  onClick: saveConfig
                }, {
                  default: vue.withCtx(() => [..._cache[4] || (_cache[4] = [
                    vue.createTextVNode("确定", -1)
                  ])]),
                  _: 1
                })
              ]),
              _: 1
            })
          ]),
          _: 1
        }, 8, ["model"]);
      };
    }
  };
  axios.interceptors.request.use((config) => {
    config.headers["X-API-Key"] = store.getItem("config").apiKey || "";
    return config;
  });
  const postmanService = {
    baseUrl: "https://api.getpostman.com",
    async getAllWorkspaces() {
      try {
        const response = await axios.get(`${this.baseUrl}/workspaces`);
        return Result.success("成功").data(response.data).build();
      } catch (e) {
        return Result.error("失败：" + e.message).build();
      }
    },
    async getAllCollections(workspaceId) {
      try {
        const response = await axios.get(`${this.baseUrl}/collections?workspace=${workspaceId}`);
        return Result.success("成功").data(response.data).build();
      } catch (e) {
        return Result.error("失败：" + e.message).build();
      }
    },
    async getACollection(collectionId) {
      try {
        const response = await axios.get(`${this.baseUrl}/collections/${collectionId}`);
        return Result.success("成功").data(response.data).build();
      } catch (e) {
        return Result.error("失败：" + e.message).build();
      }
    }
  };
  const _sfc_main$2 = {
    __name: "Postman",
    setup(__props) {
      const postmanForm = vue.reactive({
        workspaceId: "",
        collectionVal: "",
        name: ""
      });
      const workspaceOptions = vue.ref([]);
      const collectionOptions = vue.ref([]);
      const tableData = vue.ref([]);
      const selectedApis = vue.ref([]);
      const catalogFilters = vue.ref([]);
      const itemInfo = vue.reactive({
        api_key: "",
        api_token: "",
        item_id: ""
      });
      vue.onMounted(() => {
        initWorkspaces();
      });
      const handleSelectionChange = (val) => {
        selectedApis.value = val;
      };
      const filterCatalog = (value, row) => {
        return row.catalog === value;
      };
      async function initWorkspaces() {
        let result = await postmanService.getAllWorkspaces();
        if (result.isSuccess()) {
          workspaceOptions.value = result.data.workspaces;
        }
      }
      async function queryAllCollections(workspaceId) {
        collectionOptions.value = [];
        let result = await postmanService.getAllCollections(workspaceId);
        if (result.isSuccess()) {
          collectionOptions.value = result.data.collections;
        }
      }
      async function handleFilter() {
        var _a;
        let result = await postmanService.getACollection(postmanForm.collectionVal.id);
        if (result.isSuccess()) {
          tableData.value = treeToArray(((_a = result.data.collection) == null ? void 0 : _a.item) || [], "");
        }
      }
      function treeToArray(tree, catalog) {
        return tree.reduce((res, node) => {
          const { item, ...i } = node;
          if (item) {
            const separators = catalog == "" ? "" : "/";
            res = res.concat(treeToArray(item, `${catalog}${separators}${node.name}`));
          } else {
            res.push(Object.assign({}, i, { catalog }));
          }
          return res;
        }, []);
      }
      async function createDoc(row) {
        await getItemInfo();
        await updateByApi(row);
      }
      async function getItemInfo() {
        let name = postmanForm.collectionVal.name;
        let result = await showdocService.getItemByName(name);
        if (result.isSuccess) {
          let item = result.data;
          if (item) {
            itemInfo.item_id = item.item_id;
          } else {
            let params = {};
            params.item_type = 1;
            params.item_name = name;
            params.item_description = "";
            result = await showdocService.addItem(params);
            itemInfo.item_id = result.data.data.item_id;
          }
        }
        if (itemInfo.item_id == "")
          return;
        result = await showdocService.getItemKey({ item_id: itemInfo.item_id });
        if (result.isSuccess()) {
          itemInfo.api_key = result.data.data.api_key;
          itemInfo.api_token = result.data.data.api_token;
        }
      }
      async function updateByApi(row) {
        console.log(row);
        console.log(store.getItem("used_template"));
        let params = {};
        params.api_key = itemInfo.api_key;
        params.api_token = itemInfo.api_token;
        params.cat_name = row.catalog;
        params.page_title = row.name;
        params.page_content = store.getItem("used_template");
        let result = await showdocService.updateByApi(params);
        if (result.isSuccess()) {
          console.log("创建成功：" + JSON.stringify(result.data));
          showSuccess("创建成功");
        }
      }
      async function batchCreateDoc() {
        let list = [];
        if (tableData.value.length == 0) {
          showError("请先查询接口信息");
          return;
        }
        if (selectedApis.value.length == 0) {
          list = vue.toRaw(tableData.value);
        } else {
          selectedApis.value.map((item) => {
            list.push(vue.toRaw(item));
          });
        }
        await getItemInfo();
        let queue = list.map((item) => {
          return new Promise((resolve) => {
            updateByApi(item);
          });
        });
        Promise.all(queue).then((result) => {
          showSuccess("批量创建成功");
        });
      }
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock("div", null, [
          vue.createVNode(vue.unref(elementPlus.ElForm), {
            inline: true,
            model: postmanForm
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(vue.unref(elementPlus.ElFormItem), { label: "工作区" }, {
                default: vue.withCtx(() => [
                  vue.createVNode(vue.unref(elementPlus.ElSelect), {
                    modelValue: postmanForm.workspaceId,
                    "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => postmanForm.workspaceId = $event),
                    size: "small",
                    placeholder: "",
                    clearable: "",
                    onChange: queryAllCollections
                  }, {
                    default: vue.withCtx(() => [
                      (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(workspaceOptions.value, (item) => {
                        return vue.openBlock(), vue.createBlock(vue.unref(elementPlus.ElOption), {
                          key: item.id,
                          value: item.id,
                          label: item.name
                        }, null, 8, ["value", "label"]);
                      }), 128))
                    ]),
                    _: 1
                  }, 8, ["modelValue"])
                ]),
                _: 1
              }),
              vue.createVNode(vue.unref(elementPlus.ElFormItem), { label: "集合" }, {
                default: vue.withCtx(() => [
                  vue.createVNode(vue.unref(elementPlus.ElSelect), {
                    modelValue: postmanForm.collectionVal,
                    "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => postmanForm.collectionVal = $event),
                    "value-key": "id",
                    size: "small",
                    placeholder: "",
                    clearable: "",
                    onChange: handleFilter
                  }, {
                    default: vue.withCtx(() => [
                      (vue.openBlock(true), vue.createElementBlock(vue.Fragment, null, vue.renderList(collectionOptions.value, (item) => {
                        return vue.openBlock(), vue.createBlock(vue.unref(elementPlus.ElOption), {
                          key: item.id,
                          value: item,
                          label: item.name
                        }, null, 8, ["value", "label"]);
                      }), 128))
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
                    onClick: handleFilter
                  }, {
                    default: vue.withCtx(() => [..._cache[2] || (_cache[2] = [
                      vue.createTextVNode("查询", -1)
                    ])]),
                    _: 1
                  }),
                  vue.createVNode(vue.unref(elementPlus.ElButton), {
                    type: "primary",
                    onClick: batchCreateDoc
                  }, {
                    default: vue.withCtx(() => [..._cache[3] || (_cache[3] = [
                      vue.createTextVNode("批量创建", -1)
                    ])]),
                    _: 1
                  })
                ]),
                _: 1
              })
            ]),
            _: 1
          }, 8, ["model"]),
          vue.createVNode(vue.unref(elementPlus.ElTable), {
            ref: "apiTableRef",
            data: tableData.value,
            onSelectionChange: handleSelectionChange,
            height: "250",
            style: { "width": "100%" }
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(vue.unref(elementPlus.ElTableColumn), {
                type: "selection",
                width: "55"
              }),
              vue.createVNode(vue.unref(elementPlus.ElTableColumn), {
                prop: "name",
                label: "标题"
              }),
              vue.createVNode(vue.unref(elementPlus.ElTableColumn), {
                prop: "creator",
                label: "方式"
              }, {
                default: vue.withCtx((scope) => [
                  vue.createVNode(vue.unref(elementPlus.ElPopover), {
                    effect: "light",
                    trigger: "hover",
                    placement: "top",
                    width: "auto"
                  }, {
                    default: vue.withCtx(() => [
                      vue.createElementVNode("div", null, "接口地址: " + vue.toDisplayString(scope.row.request.url.raw), 1)
                    ]),
                    reference: vue.withCtx(() => [
                      vue.createVNode(vue.unref(elementPlus.ElTag), null, {
                        default: vue.withCtx(() => [
                          vue.createTextVNode(vue.toDisplayString(scope.row.request.method), 1)
                        ]),
                        _: 2
                      }, 1024)
                    ]),
                    _: 2
                  }, 1024)
                ]),
                _: 1
              }),
              vue.createVNode(vue.unref(elementPlus.ElTableColumn), {
                prop: "catalog",
                label: "目录",
                width: "100",
                filters: catalogFilters.value,
                "filter-method": filterCatalog,
                "filter-placement": "bottom-end"
              }, {
                default: vue.withCtx((scope) => [
                  vue.createTextVNode(vue.toDisplayString(scope.row.catalog || "/"), 1)
                ]),
                _: 1
              }, 8, ["filters"]),
              vue.createVNode(vue.unref(elementPlus.ElTableColumn), {
                prop: "op",
                label: "操作"
              }, {
                default: vue.withCtx((scope) => [
                  vue.createVNode(vue.unref(elementPlus.ElButton), {
                    size: "small",
                    text: ""
                  }, {
                    default: vue.withCtx(() => [..._cache[4] || (_cache[4] = [
                      vue.createTextVNode("预览", -1)
                    ])]),
                    _: 1
                  }),
                  vue.createVNode(vue.unref(elementPlus.ElButton), {
                    size: "small",
                    text: "",
                    type: "danger",
                    onClick: vue.withModifiers(($event) => createDoc(scope.row), ["prevent"])
                  }, {
                    default: vue.withCtx(() => [..._cache[5] || (_cache[5] = [
                      vue.createTextVNode("创建", -1)
                    ])]),
                    _: 1
                  }, 8, ["onClick"])
                ]),
                _: 1
              })
            ]),
            _: 1
          }, 8, ["data"])
        ]);
      };
    }
  };
  const _sfc_main$1 = {
    __name: "Home",
    setup(__props) {
      const dialogVisible = vue.ref(false);
      const configDialogVisible = vue.ref(false);
      vue.onMounted(() => {
        initMenuButton();
      });
      let showApiPlatform = function() {
        dialogVisible.value = true;
      };
      let showConfig = function() {
        configDialogVisible.value = true;
      };
      function initMenuButton() {
        if ($(".button-api-platform").length !== 0) {
          $(".button-api-platform").remove();
        }
        var css = $("#app .header-right:eq(0)");
        if ($(css).children().length > 0) {
          var html = "";
          html += '<div data-v-16856998 class="el-tooltip icon-item button-api-platform" aria-describedby="el-tooltip-9526" tabindex="0"><i data-v-16856998="" class="fas fa-laptop-code"></i></div>';
          $(css).children().prepend(html);
          $(".button-api-platform").on("click", showApiPlatform);
        } else {
          setTimeout(function() {
            initMenuButton(menuName);
          }, 1e3);
        }
      }
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createElementBlock(vue.Fragment, null, [
          vue.createVNode(vue.unref(elementPlus.ElDialog), {
            modelValue: dialogVisible.value,
            "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => dialogVisible.value = $event),
            title: "API平台",
            width: "65%",
            "append-to-body": "",
            "close-on-click-modal": false
          }, {
            footer: vue.withCtx(() => [
              vue.createVNode(vue.unref(elementPlus.ElButton), {
                type: "primary",
                icon: vue.unref(setting_default),
                circle: "",
                onClick: vue.unref(showConfig)
              }, null, 8, ["icon", "onClick"])
            ]),
            default: vue.withCtx(() => [
              vue.createVNode(_sfc_main$2)
            ]),
            _: 1
          }, 8, ["modelValue"]),
          vue.createVNode(vue.unref(elementPlus.ElDialog), {
            modelValue: configDialogVisible.value,
            "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => configDialogVisible.value = $event),
            title: "设置",
            width: "550",
            "append-to-body": "",
            "close-on-click-modal": false
          }, {
            default: vue.withCtx(() => [
              vue.createVNode(_sfc_main$3)
            ]),
            _: 1
          }, 8, ["modelValue"])
        ], 64);
      };
    }
  };
  const _sfc_main = {
    __name: "App",
    setup(__props) {
      return (_ctx, _cache) => {
        return vue.openBlock(), vue.createBlock(_sfc_main$1);
      };
    }
  };
  vue.createApp(_sfc_main).mount(
    (() => {
      const app = document.createElement("div");
      document.body.append(app);
      return app;
    })()
  );

})(Vue, $, ElementPlus, axios);