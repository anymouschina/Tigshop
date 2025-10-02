# 静态资源目录精简与兼容迁移（草案）

更新时间：2025-10-02

目的：清理 `static/static/` 等冗余层级，保持 `/static/**` 访问路径不变，避免前后端资源 404。

## 现状速览

- Nest 静态资源挂载（见 `src/main.ts`）：
  - `/uploads/**` → 仓库根 `uploads/`
  - `/` → 仓库根 `static/`
- 目录结构（节选）：
  - `nest/static/` 下包含子目录：`admin/`、`img/`、`install/`、`mobile/`、`pc/`、`static/`（注意：存在 `static/static/`）
- 代码与前端产物中存在多处 `/static/**` 引用，例如：
  - `src/setting/config.controller.ts` 默认图标：`/static/mini/images/common/default_tech_support.png`
  - `nest/static/mobile/**` 的资源与 CSS 内外链

风险点：
- `useStaticAssets(publicPath, { prefix: "/" })` 使 `static/` 成为根级静态目录，迁移需确认不影响 API 路由与现有资源路径解析。
- 前端产物（admin/mobile/pc）中内联/外链路径可能包含绝对 `/static/...`，需要兼容。

## 迁移选项

- 方案 A（推荐）：将 `static/static/` 重命名为 `static/assets/`
  - 优点：语义明确，避免双重 static；便于后续分层（mini/common等）。
  - 兼容方案：
    - 临时保留从 `/static/static/` 到 `/static/assets/` 的软链接或重写（生产环境可由网关/Nginx 实现 302/内部映射）。
    - 代码不改动 `main.ts`，先完成目录层级整理，验证资源 404 为 0 后再逐步移除兼容映射。
- 方案 B（保守）：保留 `static/static/` 目录，仅在 README 中标注“历史遗留，勿新增”，新资源统一放入 `static/assets/`。
  - 优点：无风险；
  - 缺点：目录长期“双轨”。

## 建议实施步骤（分两步）

1) 清点与准备
- 统计 `nest/static/static/` 下全部文件与被引用情况（admin/mobile/pc 构建产物、服务端返回的默认资源）。
- 标记需长期保留的资源与可归档/删除的资源。

2) 目录迁移与兼容
- 将 `nest/static/static/` 平移为 `nest/static/assets/`。
- 本地/生产通过反向代理或软链接保持 `/static/static/*` 可访问（仅过渡期）。
- 保留 `/static/mini/**`、`/static/common/**` 等现有路径；尽量不改动产物内路径。

## 验收清单
- 页面打开无静态 404，控制台无资源错误。
- 服务端返回默认资源（如 tech_support、powered_by_logo）路径可正常访问。
- 移除兼容映射后（灰度）无异常上报。

---
备注：本草案仅文档准备，未更改任何运行时代码；执行迁移前需在下轮完成一次最小构建与冒烟验证。
