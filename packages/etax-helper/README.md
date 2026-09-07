# ETax 助手

基于 Vue 3、Element Plus 和 vite-plugin-monkey 的浏览器用户脚本。当前版本 **1.2.3**。

[安装或更新脚本](https://raw.githubusercontent.com/kxx/k-script/main/packages/etax-helper/dist/etax-helper.user.js)

## 使用

1. 安装支持 `GM_getValue`、`GM_setValue`、`GM_xmlhttpRequest`、`unsafeWindow` 的脚本管理器（如 Tampermonkey），安装上方脚本。升级时允许新增的存储、剪贴板及页面访问权限。
2. 打开电局页面，点击左下角的圆形纸飞机。主导航为账户、请求；右上角齿轮进入设置。
3. 在设置中填写 API Key 后保存，进入账户页或刷新账户列表。
4. 账户页点击“手动登录”，选择平台并填写 Token，点击“写入并打开”。默认使用新标签页，可在设置中关闭。

旧站点 localStorage 中的 `etax_helper_config` 在首次读取时迁移至脚本管理器。已有脚本配置优先；保存成功后删除当前站点旧配置。其他地区的旧配置不会覆盖已保存的配置。

## 功能与兼容边界

- **账户**：查询后端 `workspaces`，支持税号、企业名、Cookie ID 本地搜索；兼容原有 `name/name2/name3` 字段。状态缺失显示“未校验”。
- **手动登录**：发票业务写入原有三个 Cookie；其他平台使用当前页面的 `clientId` 写入 Tpass Cookie。Cookie 写入后进行读取检查，不能据此认定服务端登录有效。
- **入口兼容**：保留 `8443` 端口和原有 `.chinatax.gov.cn` Cookie 作用域。账户查询、退税管理仍通过 `/loginb/` 统一入口，登录后在电局进入业务。未验证的地区端口、专用跳转和 Cookie 作用域不能猜测修改。
- **未接通功能**：原有“校验”和 DTA/BIM/RIM 按钮没有完整实现，本版隐藏未接通按钮，避免干扰账户列表。接入前需确认服务端字段、授权映射与登录状态接口。
- **请求**：面板打开前就开始采集当前页面的 XHR/Fetch；只安装一次，切换标签不会重复监听。支持 URL、GET/POST、失败筛选，暂停、清空、耗时、参数、响应及复制。点击表格行进入抽屉内详情，可切换参数/响应；JSON 使用安全的文本节点语法高亮。
- **记录限制**：最多 50 条；XHR 文本按 64 Ki 字符截断，Fetch 文本最多读取 64 KiB。清空后，之前尚未完成的请求不会重新进入列表。暂停仅阻止新请求采集，已在途请求仍可完成记录。
- **响应兼容**：JSON、文本均可查看；二进制只显示类型；流式响应不读取内容。Fetch 使用副本，保留原始 Promise 和响应；传入 `Request` 对象时不主动读取其请求体。
- **解密**：点击“解密参数”后向 `https://skynjweb.com:7443/dppt/ac-api/support/decryptJmbw` 发送密文、请求 URL 和采集该请求时的 `dzfp-ssotoken`。未采集到 Token 时提示重新登录并发起请求，不使用可能已切换账户的新 Token。
- **复制**：默认替换常见 JSON/查询字符串中的 Token、Cookie、密码、API Key 字段。脱敏不是对任意业务文本的完整识别，分享前仍应核对内容。
- **样式**：Element Plus CSS 与面板放在 Shadow DOM 内，下拉菜单、消息也挂载到内部容器。面板使用独立容器，不修改主系统 body 的滚动样式或类名。左边缘支持拖动调宽及方向键调整，宽度自动保存，窄屏最多占 96vw。Esc 关闭，Tab 在面板内循环。

Vue 3、按需引用的 Element Plus 组件及图标均内置于脚本，没有 CDN `@require`，不读写主系统的 `window.Vue` 或 `window.ELEMENT`。`document-start` 表示尽早执行，脚本管理器调度、页面缓存原始请求函数等因素仍可能导致部分请求无法采集。每个匹配的 iframe 单独采集，未汇总跨 frame 请求。真实税局登录和各地区业务兼容性需要现场验证。

## 开发与验证

在仓库根目录使用 **Node.js 22、pnpm 9.15.9**（`packageManager` 固定版本），以 `pnpm-lock.yaml` 为依赖依据：

```bash
pnpm install --frozen-lockfile
pnpm etax-helper:dev
pnpm etax-helper:test
pnpm etax-helper:build
```

历史 npm 锁文件用于其他旧工作流，不作为本模块的构建依据；请勿交替安装更新锁文件。

`package.json` 的 `version` 是唯一版本来源，自动写入面板和用户脚本元数据。发布时同时提交源码和 `dist/etax-helper.user.js`，保持已有安装 URL。GitHub Actions 会执行核心测试、构建，并检查产物是否同步。

| 目录 | 职责 |
|---|---|
| `src/components` | 账户、请求、设置界面 |
| `src/core` | 浏览器监听、Cookie 操作 |
| `src/config` | 地区识别和平台入口 |
| `src/services` | 后端接口及超时、错误处理 |
| `src/stores` | 配置迁移与存储 |
| `src/utils` | 内容格式化、脱敏、通知 |
| `tests` | 原始请求行为、边界条件和接口契约回归测试 |

现场验收建议：首次安装配置；切换模式后单条采集；JSON/HTML/文件下载；Token 刷新后新请求解密；手动登录两个平台；关闭新标签页；页面原有弹窗和业务样式。

## 1.2.1 验证记录

- 核心回归测试覆盖 XHR/Fetch 行为、Cookie、接口契约、响应格式化和 JSON 高亮。
- 在 Chromium 中加载 Vue 2.7.16 + Element UI 2.15.14 的模拟主系统，验证插件打开前后主系统按钮样式、body 类名/样式不变，Vue/ELEMENT 对象引用保持不变，主系统弹窗正常。
- 浏览器交互验证：纸飞机入口、账户展示、手动发票平台登录（模拟 Token）、设置保存、鼠标/键盘调宽、请求详情/解密/复制（模拟服务）、下拉菜单及消息隔离、窄屏适配、无主系统 Vue 时的 document-start 启动。
- 模拟主系统验证不替代真实电局账户登录验收。

## 入口与更新排查（1.2.2）

本版修复内置依赖在严格 CSP 和油猴全局对象差异下尝试 `Function("return this")()` 的启动异常。构建只将 lodash-es 的 `_root.js` 替换为 `globalThis`，不放宽主系统 CSP，也不改写主系统 Vue。发布检查禁止产物出现动态 Function/eval。

纸飞机宿主位于 documentElement，主页面重绘 body 不会删除入口；宿主被直接移除时复用现有实例恢复，不重新安装请求监听。

脚本头显式声明固定 updateURL 和 downloadURL。旧安装如果没有有效更新地址，需要从 README 安装链接覆盖更新一次；不要先删除脚本，以免丢失配置。安装后刷新税局页面，并确认油猴中的版本为 1.2.2。如果仍未出现，检查当前域名是否命中脚本规则、脚本是否启用，以及控制台首条脚本错误。

## 油猴作用域兼容（1.2.3）

现场 `x0 is not a function` 对应旧产物中的 `window.GM_getValue`。本版通过 `src/core/userscript.js` 直接访问油猴注入的作用域绑定，不再使用构建插件 `$` 导出的 window.GM_* 访问路径。全部 API 显式声明权限，并由构建检查防止退回旧实现。

验证包含：GM API 仅为局部绑定且 window 上完全没有对应属性；旧版复现同一报错，新版纸飞机、配置读写、账户请求、登录开页、解密及复制均可用。GM 存储接口异常时保留入口，并在设置页显示错误，不会自动覆盖或删除无法读取的持久配置。
