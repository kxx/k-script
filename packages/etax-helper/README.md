# ETax 助手

基于 Vue 3、Element Plus 和 vite-plugin-monkey 的浏览器用户脚本。当前版本 **1.2.9**。

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

在仓库根目录使用 **Node.js 22.20+（22.x）或 24.12+、pnpm 9.15.9**（`packageManager` 固定版本），以 `pnpm-lock.yaml` 为依赖依据：

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
| `src/core` | 浏览器监听、Cookie 操作、配置迁移与持久化 |
| `src/config` | 地区识别和平台入口 |
| `src/services` | 后端接口、账户查询和登录流程 |
| `src/composables` | 账户与登录界面状态及生命周期 |
| `src/stores` | 配置与运行诊断的响应式状态 |
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

## 稳定性改造（1.2.4）

- 配置、XHR 和 Fetch 分别记录启动结果。配置读取或拦截安装失败不会中断纸飞机挂载；页脚区分正常、部分可用、失败和暂停。
- 设置底部“运行诊断”默认折叠，提供脚本/管理器版本、地区、frame、GM 接口可用性、模块状态、最近一次内部错误。错误使用固定原因码，不保存原始异常；复制只含这些字段和页面 origin，不含路径、查询参数、片段、配置或请求，也不会上传。
- “重试读取配置”重新载入持久配置并同步设置表单（会替换表单中尚未保存的编辑）；读取失败时禁止写入。旧 localStorage 迁移仍在成功读取、校验后执行，保存成功后清理旧值。
- “重试请求采集”只重试未成功的传输层。XHR 部分安装失败会回退已安装的包装，避免重复监听。页面退出清理观察器、订阅、XHR 事件和正在读取的 Fetch 副本；浏览器往返缓存保留原实例。
- 生产依赖和工具链版本未升级；Vue 2 / Element UI 仅用于模拟旧主系统的测试 fixture，不打进用户脚本。

运行生成产物的浏览器回归：

```bash
pnpm --filter etax-helper exec playwright install chromium
pnpm etax-helper:build
pnpm --filter etax-helper test:browser
```

浏览器测试通过真实响应头施加不含 unsafe-eval 的 CSP，GM API 仅为 userscript 局部绑定。覆盖正常启动、配置读取失败、XHR/Fetch 单独及同时失败、恢复后重复重试、诊断脱敏、主系统 Vue 2/Element UI 共存、宿主移除及 body 重绘。CI 同步执行该测试。它模拟脚本管理器的注入行为，不能替代真实 Tampermonkey 和各省电局现场验收。

已确认可用基线为提交 `1c276fbdc8933085afd99978cf3b8a584929c352`（1.2.3）。可从[基线提交](https://github.com/kxx/k-script/tree/1c276fbdc8933085afd99978cf3b8a584929c352/packages/etax-helper)获取源码和安装脚本。GitHub Actions 创建标签被权限限制拒绝（403），因此暂未创建远程标签；回退以该固定提交为准。详细发布记录见 [CHANGELOG.md](CHANGELOG.md)。

## 构建工具链（1.2.6）

`etax-helper` 显式声明自己的运行时与开发依赖，构建不再依靠根包提供 Vite 或 Vue 插件。固定版本：

| 分类 | 依赖 | 版本 |
|---|---|---|
| 构建 | Vite | 8.2.2 |
| 构建 | @vitejs/plugin-vue | 6.0.8 |
| 构建 | vite-plugin-monkey | 8.1.1 |
| 运行时 | Vue | 3.5.26（保持原版） |
| 运行时 | Element Plus | 2.13.1（保持原版） |
| 运行时 | @element-plus/icons-vue | 2.3.2（保持原版） |

Vite 8 使用 Rolldown/Oxc；移除旧 `minify: 'esbuild'` 设置，使用其原生压缩器。显式保留 Vite 4 的 JavaScript 编译目标，避免默认目标变化导致额外抬高语法要求；这不代表已验证这些旧浏览器的所有 Web API。CSP 的 lodash 全局对象修复、GM 局部绑定、Shadow DOM 及安装地址继续保留。

Node 版本约束适用于开发/CI，不要求安装脚本的用户安装 Node。CI 在 Node 22 和 24 分别执行核心测试、构建、产物一致性和浏览器回归。根包旧依赖仍供 qixin-helper / showdoc-helper 使用，为其他两包补充显式 Vite 4.5.14 声明，防止 pnpm 将它们的插件 peer dependency 自动绑定到本包的 Vite 8，本次不升级其他脚本工具链；Vue 2 / Element UI 仅用作浏览器测试中的模拟主系统。

参考：[Vite 8 迁移说明](https://vite.dev/guide/migration)、[油猴构建插件](https://github.com/lisonge/vite-plugin-monkey)。

本轮稳定基线：[已验收的 1.2.5](https://github.com/kxx/k-script/tree/7f0fd296a6ee124e2c31548cd69dbe0c2ac52de7/packages/etax-helper)。后续按独立版本推进配置迁移规则与业务逻辑整理、请求排查效率、发布流程完善，避免把这些功能变化混入工具链升级。

## 配置与账户逻辑（1.2.7）

- 配置格式版本 `schemaVersion: 1` 与脚本版本独立。保留 `etax_helper_config` 存储键及 `apiKey/newTab/tab/width` 扁平字段，兼容旧脚本读取。
- 没有版本号的 GM 配置先在内存中迁移，成功保存时写入版本；旧 localStorage 配置在 GM 读取成功、格式校验通过后迁移，保存成功前不删除旧数据。未知扩展字段保留。
- 更高格式版本、异常字段类型或读取失败会阻止写入，避免用默认值覆盖原配置；可在设置中重试读取。面板宽度接受旧数字字符串并限制在现有范围内。
- 保存偏好时先重新读取持久配置，再合并本次修改，减少旧页面覆盖新设置的风险；GM 同步读写不提供跨标签页事务，完全同时的写入仍可能出现最后写入覆盖。
- `src/core/config.js` 负责迁移、校验和持久化；`src/stores/config.js` 只管理 Vue 状态和运行诊断。
- `src/services/accounts.js` 统一新旧账户字段、搜索和查询生命周期；`src/services/manual-login.js` 负责平台地址、Cookie 校验与跳转顺序。`src/composables` 管理界面状态，账户组件只负责展示和绑定操作。
- 查询结果在组件卸载或 API Key 变化后不再更新界面；保留原有地区参数及服务协议。发票平台不需要 clientId，因此不读取该站点存储；其他平台仍按原规则校验 clientId。
- 浏览器回归新增旧配置迁移、更高配置版本阻止写入场景。账号、Cookie、Token、配置内容均不会加入运行诊断或自动上传。

本轮回退基线为[已验收的 1.2.6](https://github.com/kxx/k-script/tree/61e4192a618cc5aa569975631031ecb622f9866d/packages/etax-helper)。下一阶段单独改进请求排查效率，本版不新增请求操作或改变现有布局。

## 请求排查工具（1.2.8）

- **固定请求**：点击列表星标或详情中的“固定请求”。最多固定 10 条，包含在总共 50 条的限制内；新记录只淘汰未固定项。切换标签、关闭再打开面板均保留，刷新页面后清除，不写入持久配置。固定后仍使用采集该请求时的 Token 解密。
- **清空**：工具栏垃圾桶清空未固定项；有固定项时显示“清空全部”，可同时移除固定项。两种清空均阻止之前在途请求完成后重新进入列表。
- **路径归类**：选择“按路径”，以请求方法 + origin（含端口）+ 完整 pathname 分组，忽略查询参数。不同域名、GET/POST、不同路径 ID 不合并。次数、失败数仅统计当前筛选下仍保留的记录，不是页面累计总数；点击分组进入逐条详情。
- **复制 cURL**：详情中复制脱敏的 Bash 命令模板，不自动执行。支持 HTTP/HTTPS；移除 URL 用户名、密码和片段，替换常见敏感查询参数、JSON/表单字段。完整的已识别 JSON/URL 编码表单可加入请求体；文件、Request 对象未读取的请求体、已截断内容和未识别文本均省略并提示。导出的是采集时的请求，不是解密后的展示内容。
- **模板边界**：没有采集请求头、Cookie、浏览器自动附加的认证信息，无法保证直接重放成功。导出请求体时显式抑制 curl 自动生成的 Content-Type，请补充实际请求所需头部。命令按 Bash 转义，不能直接作为 Windows CMD 命令；Windows 可在 Git Bash / WSL 使用。脱敏只识别常见字段，分享或执行前仍需核对。
- **完整性提示**：列表标记内容不完整，详情按请求体/响应分别提示。XHR 和字符串请求体超限时标记“已截断”；Fetch 读取达到 64 KiB 后不继续读取，标记“达到采集上限，可能不完整”；文件、流式响应等显示“未完整读取”。保留原始请求返回值、Promise 和响应体。

本轮回退基线：[已验收的 1.2.7](https://github.com/kxx/k-script/tree/6f4667bd4c5da4b81dc4ea3f715e8146fcede3de/packages/etax-helper)。下一阶段单独完善发布流程。


## 正式发布与回退

版本号仍以本包 `package.json` 为唯一来源。准备下一版时，将本次说明写入临时 Markdown 文件（正文使用条目，不写版本标题），然后在仓库根目录执行：

```bash
pnpm --filter etax-helper release:prepare 1.2.10 /absolute/path/release-notes.md
pnpm etax-helper:build
pnpm etax-helper:test
pnpm --filter etax-helper test:browser
```

准备命令同步 package.json、README 版本和 CHANGELOG 最新条目，拒绝相同/降低的版本号及空说明。构建会检查版本、更新地址、脚本权限及更新说明一致性。提交时包含源码、文档与构建后的 `dist/etax-helper.user.js`。

- main 推送先运行 Node 22/24 测试、构建一致性和浏览器回归。仅当本次推送前后的版本号增加，才自动发布 `etax-helper-v版本号`；普通提交只检查。
- 发布先创建固定提交的标签和草稿，再上传 `etax-helper.user.js`、`SHA256SUMS.txt` 并核对 SHA-256，全部成功才公开。已公开版本不覆盖，标签不移动。失败时可重跑工作流，未公开草稿可续传。
- Actions 的 **ETax Helper checks → Run workflow → main** 支持手动补发，仍先跑全部检查；同版本标签对应其他提交时会拒绝，需准备新版本。发布任务需要仓库允许 `GITHUB_TOKEN` 的 contents 写权限。
- [历史正式版本](https://github.com/kxx/k-script/releases?q=etax-helper-v) 从 1.2.9 开始留存；此前版本可从相应历史提交的 dist 安装，不能假定都兼容当前配置。仓库内其他脚本使用自己的版本，不共用 ETax 发布标签或 Latest 标记。
- 设置页提供检查更新、更新说明及历史版本入口。检查更新只是打开安装页，由油猴比较版本并确认安装；不会自动执行下载内容，也不向 GitHub 发送 API Key、Cookie 或请求记录。

**现有 main 安装/更新地址保持不变**：它在提交后立即变化，并不是等 CI 通过才可更新的稳定频道。正式版本附件在全部检查通过后才发布，版本标签和附件便于复现与回退。

回退前用脚本管理器导出并妥善保存配置备份，暂停该脚本自动更新，再从历史版本附件安装；脚本管理器可能要求确认降级。回退脚本不等于回退配置。若旧版提示高版本配置不兼容，应恢复新版，不要重置或删除配置；更早的版本可能没有高版本写入保护。问题解决后安装新版并恢复自动更新。
