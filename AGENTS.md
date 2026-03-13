# Repository Guidelines

## 项目结构与模块职责
- `src/` 为核心代码：`components/` 承载 UI 原子与布局组件，`views/` 存放页面级容器，`api/` 与 `services/` 负责数据获取及 TOML 配置加载，`stores/` 使用 Pinia 管理状态，`config/` 提供可编辑的 `site.toml`、`profile.toml`、`theme.toml`。Markdown 文章位于 `src/content/articles/`，静态资源存放在 `public/`，打包产物输出到 `dist/`，`docs/` 保存对外文档。

## 构建、测试与开发命令
建议使用 pnpm 保持与锁文件一致。
- `pnpm install`：安装依赖。
- `pnpm dev`：启动 Vite 开发服务并启用 HMR。
- `pnpm build`：构建站点版产物至 `dist/`。
- `pnpm build:lib`：使用 `vite.config.lib.js` 产出可复用组件库。
- `pnpm preview`：本地预览生产构建，便于冒烟测试。

## 代码风格与命名
- 延续 Vue 3 `<script setup>` + Composition API 写法，组件采用 PascalCase（如 `ArticleList.vue`），工具/服务模块使用 camelCase（如 `configLoader.js`）。
- Vue SFC 与 JS 模块统一 2 空格缩进，import 顺序保持 核心→三方→本地。
- 样式以 Tailwind CSS 为主，新主题变量请写入 `src/theme/` 或 `tailwind.config.js`，避免散落的硬编码颜色。
- 提交前在编辑器执行 Prettier；若仓库后续提供 `pnpm lint`，请一并运行。

## 测试准则
当前尚无自动化测试，务必通过 `pnpm dev` 进行交互验证，并用 `pnpm preview` 检查生产包。新增测试时贴近组件放置（如 `Foo.spec.js`），覆盖文章加载、配置覆写、路由守卫等关键流程；在 PR 描述中说明手动/自动测试结果直至正式引入覆盖率门槛。

## 提交与 PR 规范
- 仿照历史记录使用前缀（`add:`、`fix:` 等）+ 简短祈使句，可根据需要使用中文描述。
- PR 需说明问题背景、修改范围（文件或模块）、验证方式，并引用相关 issue 或配置（示例：“更新 `src/config/site.toml`”）。若影响前端界面，请附截图或 GIF，并确认 `pnpm build` 与 `pnpm preview` 无错误后再请求评审。

## 配置提示
TOML 配置通过定制 Vite 插件支持热重载。新增配置方案时复制 `src/config/profile_default.toml` 作为模板；切勿把密钥写入仓库，可通过环境变量或被 `.gitignore` 的私有文件注入 API 入口。
