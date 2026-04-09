# Repository Guidelines

## 项目结构与模块职责
- `blog/` 为默认博客站点内容区：`config/` 存放 `site.toml`、`profile.toml`、`theme.toml`，`content/articles/` 存放 Markdown 文章。
- `src/framework/` 为框架核心：负责可复用组件、视图、路由、Markdown 内容服务、核心 store 与库入口。
- `src/site/` 为框架自带站点应用层，只负责启动与装配；若需要站点静态资源，放在 `public/`，打包产物输出到 `dist/`。

## 构建与开发命令
建议使用 pnpm 保持与锁文件一致。
- `pnpm install`：安装依赖。
- `pnpm dev`：启动 Vite 开发服务并启用 HMR。
- `pnpm build`：构建站点版产物至 `dist/`。
- `pnpm build:lib`：使用 `vite.config.lib.js` 产出可复用组件库。

## 代码风格与命名
- 延续 Vue 3 `<script setup>` + Composition API 写法，组件采用 PascalCase（如 `ArticleList.vue`），工具/服务模块使用 camelCase（如 `configLoader.js`）。
- Vue SFC 与 JS 模块统一 2 空格缩进，import 顺序保持 核心→三方→本地。
- 样式以 Tailwind CSS 与 `src/framework/style.css` 为主，新主题变量优先收敛到 `tailwind.config.js` 或框架样式入口，避免散落的硬编码颜色。
- 提交前在编辑器执行 Prettier，确保文件格式一致。

## 提交与 PR 规范
- 仿照历史记录使用前缀（`add:`、`fix:` 等）+ 简短祈使句，可根据需要使用中文描述。
- PR 需说明问题背景、修改范围（文件或模块）、验证方式，并引用相关 issue 或配置（示例：“更新 `blog/config/site.toml`”）。若影响前端界面，请附截图或 GIF，并确认 `pnpm build` 与 `pnpm build:lib` 无错误后再请求评审。

## 配置提示
TOML 配置通过框架配置加载器支持热重载；不要把服务端密钥、第三方统计配置或运行时接口配置写入这个静态仓库。
