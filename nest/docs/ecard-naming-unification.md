# 电子卡券领域命名统一（草案）

更新时间：2025-10-02

目标：统一代码导出命名（统一使用 `ecard` 前缀），保持 Prisma 模型/表名不变（例如 `e_card_group`）。

## 现状
- 代码：存在 `ECardService`/`ECardGroupService`、控制器路径 `admin/product/ecard` 与 `admin/product/ecard-group`；兼容控制器 `admin-ecard-group-compat.controller.ts` 访问 `e_card_group` 表。
- 数据库：Prisma 模型对应 `e_card_group`、`eCard` 等复合风格命名（历史原因）。

## 原则
- 代码导出统一为小写驼峰域名 `ecard*`（例如：`EcardService` → `EcardService` 或保持类名，但导出 token/模块名统一 `EcardModule` 等）。
- 控制器路由不变，避免前端破坏；内部 import/export 命名统一。
- Prisma 模型/表名严格保持不变，防止原始 SQL 与现有查询损坏。

## 步骤
1) 清点导出与引用
- `src/product/ecard/**` 与 `src/product/ecard-group/**` 的模块、服务、控制器导出名与被引用点。
- `src/app.module.ts` 及其他模块的 imports/providers/exports token。

2) 最小改动统一
- 仅调整导出/import 的符号名，避免文件路径与路由变化。
- 保留 `admin-ecard-group-compat.controller.ts` 作为兼容入口，后续可归并到 `ecard-group` 模块。

3) 冒烟
- Admin 后台 eCard/eCardGroup 列表、详情、增删改均可用；
- 相关导出 API（导入/导出）正常；
- 订单详情涉及 eCard 展示正常。

---
备注：本草案仅文档，下一轮提交改名补丁并进行最小冒烟。
