# Tigshop 重构与去重计划（前台商品域优先）

> 目的：收敛重复逻辑与分散职责，统一目录与命名规范，保证对前端协议无破坏的前提下，让项目结构更清晰、可维护。

更新时间：2025-10-02（本轮仅推进文档与清点，按要求跳过构建与单测执行）

## 一、已识别的重复/冗余点

- 路由/接口层
  - 规则：/api 与 /adminapi 前缀下的同名接口不视为重复，它们属于不同作用域（前台与后台），仅在职责越界或实现分散时需要收敛共享的 Service/DTO。
  - [ ] detail 与 public-detail 重复（同为公开接口，返回相同数据）。
  - [x] 价格/库存能力在多个接口里重复实现和格式化（getProductAvailability / getProductAmount / getBatchProductAvailability / getPriceInBatches）。已收敛至 ProductPricingService 并切换相关控制器。
  - [ ] 控制器中直接访问数据库（(service as any).prisma）违背分层，导致重复查询与难以复用。
  - [ ] promotion/getCoupon/isCollect/afterSalesService 等接口返回 Mock 数据，与对应模块职责重复/冲突。
- 业务逻辑层
  - [x] 金额/重量/时间格式化多处重复（product-detail.service.ts、admin-product.controller.ts 等）。已抽取 common/utils/format.ts 并替换两处实现。
  - [x] 评论统计重复（detail service 手工统计 vs commentService.getCommentStats）。已统一复用 CommentService.getCommentStats。
  - [x] 服务说明与电子卡券组逻辑分散（admin 已实现，前台 detail 未复用）。前台 detail 已补齐 eCardGroup 并复用。
  - [x] 依赖注入拆分后遗漏 PrismaModule 导致 CommentService 注入失败（已在 product/user 两处 CommentModule 补充 PrismaModule）。
- 目录/命名层
  - [x] statistic/ 与 statistics/ 并存（职能相近）。已合并至 statistics，并通过 Facade 兼容改造 CronService。
  - [ ] static/static/ 嵌套命名冗余。
  - [x] src/app.contronller.ts 文件名拼写错误（已更名为 app.controller.ts 并更新引用）。
  - [ ] ecard/e_card 命名风格不一（风险：混用）。
- DTO/类型与返回结构
  - [ ] 多处重复定义返回结构，缺少集中 DTO（例如价格/库存、商品详情返回等）。

## 二、分阶段落地

### 阶段1（Quick Wins）
- [x] 在 Swagger 中将 public-detail 标记为 deprecated，并计划将其作为 detail 的别名保留 1-2 个版本。
- [x] 抽出通用格式化工具 common/utils/format.ts：toMoneyString/toWeightString/toDateTime，并替换两处重复实现（product-detail.service.ts、admin-product.controller.ts）。
- [x] 在 ProductDetailService 内实现：
  - [x] getServiceList(productId)：解析 product_service_ids 并查询 product_services。
  - [x] eCardGroup(cardGroupId)：查询 e_card_group（必要时包含可用库存统计）。
- [x] ProductDetailService 评论统计统一来自 commentService.getCommentStats()，仅做字段映射。

验收标准：
- 编译通过、lint 通过；商品详情接口响应不变；public-detail 在文档中显示 Deprecated。
 - 修复 DI：ProductDetailService 注入 CommentService 可解析（CommentModule 显式导入 PrismaModule）。

### 阶段2（逻辑收敛）
- [x] 新建 ProductPricingService：统一封装价格/库存/批量与合计逻辑；Controller 仅调用 Service。
- [x] Controller 禁止直接使用 prisma，全部改为注入的服务方法。（已在 product.controller.ts 四个相关接口完成）
- [x] 为价格/库存/商品详情输出建立 DTO（types 或 product/dto）。

验收标准：
- 价格/库存接口代码行数减少、重复逻辑集中；单元测试覆盖核心路径（至少 1 个 happy path + 1 个边界）。
- 本轮执行说明：跳过单测执行，仅提交落地代码；单测运行推迟到下一轮统一验证。

### 阶段3（目录与命名规范）
- [x] 合并 statistic → statistics（或反向，以功能更全者为准），迁移并修正 import。
  - [x] 引用清点：发现仅 `src/cron/cron.service.ts` 直接依赖 `src/statistic/statistic.service.ts`（legacy）。
  - [x] 方案评估：
    - A. 在 `statistics` 新增 Facade（兼容层）以复用现有服务，暴露与 `StatisticService` 兼容的方法（getDashboardStats/getUserStats/getProductStats/getOrderStats/clearCache）。
    - B. 改造 `CronService` 直接注入并调用 `StatisticsModule` 内的新服务，删除 legacy `statistic` 目录。
  - [x] 决策与落地：采用 Facade 思路（已在 `statistics` 下新增 `StatisticsFacadeService`）+ 改造 `CronService` 依赖 Facade，随后移除 legacy 目录。
  - [ ] 回归冒烟：执行每日任务路径的最小集成验证（构建 -> 启动 -> 触发/模拟任务）。备注：本轮按要求跳过运行，推迟到下一轮。
- [ ] 清理 static/static/ 冗余层级；如需，改为 static/assets。
  - [ ] 清点 static/static/ 下资源与真实引用（后端 ServeStatic 配置、前端静态链接、截图/文档等）。
  - [ ] 方案 A：重命名/下沉为 static/assets，并保留 `/static/**` 兼容路由（重写/软链接）。
  - [ ] 方案 B：仅删除冗余内容，保留必要文件；新增 README 说明用途与引用方。
  - [ ] 一次性迁移并冒烟验证（页面资源 404 与控制台错误为 0）。
- [x] 修正文件名 app.contronller.ts → app.controller.ts，并更新引用。
- [ ] 统一电子卡券领域命名（Service/Module 导出保持 ecard 一致；Prisma 模型名保持表名即可）。
  - [ ] 统一代码层导出命名为 ecard（服务/模块/控制器导出名称）。
  - [ ] 清点 `product/ecard*` 与 `product/ecard-group` 的导出命名与引用一致性。（初步清点：存在 ECard Service/Module 与 e_card_group 表并存；命名需统一为 ecard 导出，保留 Prisma 表名不变）
  - [ ] 执行更名与引用修正，完成最小冒烟。

验收标准：
- 目录结构清晰，无重名冲突；运行与文档链接均正常。

### 阶段4（Mock 接口迁移到真实服务）
- [ ] promotion：接入真实促销服务或下线。
- [ ] getCoupon：接入优惠券服务。
- [ ] isCollect：接入用户收藏服务。
- [ ] afterSalesService：接入配置/内容服务。

验收标准：
- 移除 Mock；文档描述与实际一致；必要时提供兼容开关或灰度。

## 三、任务看板（可打勾跟踪）

- 路由去重
  - [x] 标记 public-detail 为 Deprecated（已开始）
  - [ ] 在 release note 中提示迁移到 /detail
  - [ ] 统计访问量，确认前端切换后移除 public-detail
- 工具与格式化
  - [x] 新增 common/utils/format.ts
  - [x] 替换 product-detail.service.ts 中的本地函数
  - [x] 替换 admin-product.controller.ts 中的本地函数
- 商品详情能力补齐
  - [x] serviceList 按 product_service_ids 返回详情
  - [x] eCardGroup 根据 card_group_id 返回组信息
  - [x] 评论统计复用 commentService，移除重复计算
- 价格库存能力收敛
  - [x] 新建 ProductPricingService
  - [x] 控制器四个接口切换至新服务
  - [x] 添加基础单测（getAvailability/getAmount/getBatchAvailability/getPriceInBatches）
  - [ ] 执行并确保单测通过（green）（本轮按要求跳过执行）
  - [x] 在 Home 模块路径中验证 ProductModule 的导出是否满足使用方（Home 前台模块已导入 ProductModule，注入无误）
- 目录/命名清理
  - [x] statistic/ 与 statistics/ 合并
    - [x] 清点引用（仅 CronService 直接依赖 legacy StatisticService）
    - [x] 改造 CronService 使用 StatisticsModule 的 Facade（StatisticsFacadeService）
    - [x] 移除 legacy `src/statistic` 目录
    - [ ] 冒烟验证 Cron 路径（本轮跳过单测与运行，待下一轮统一验证）
  - [ ] static/static/ 清理
  - [x] app.contronller.ts 更名（已改为 app.controller.ts 并更新引用）
  - [ ] ecard 命名统一
  - [x] Home 模块说明：`src/home`（前台）与 `src/content/home`（内容管理）为不同域的模块，非重复；保持分域明确并避免交叉依赖。（已确认并记录）
- Mock 下线/真实接入
  - [ ] promotion
  - [ ] getCoupon
  - [ ] isCollect
  - [ ] afterSalesService

## 四、影响面与回滚策略

- 所有对外接口保持兼容；public-detail 仅标记弃用，短期仍可访问。
- 对公共工具的抽取会改变 import；一经发现异常，可回滚到上一提交。
- 目录变更需一次性完成并通过构建与端到端冒烟。
 - DI 修复涉及 CommentModule 依赖 PrismaModule：如出现回归，可临时回滚到未引入 CommentService 的 ProductDetailService 版本，或在 AppModule 中短期引入 user.comment 模块以旁路依赖。
 - 统计合并回滚：如 Facade 路径出现异常，可临时恢复 `CronService` 对 legacy `StatisticService` 的依赖（从版本库恢复该文件），并回退 Facade 注入；优先修复 Facade 以减少重复实现。
  - 临时保留 legacy 文件路径备份说明：`src/statistic/statistic.service.ts` 将在完成冒烟后删除；当前若仍存在于工作区，仅做回滚备用，不再被模块引用。

## 五、参考与约定

- 统一响应壳：{ code, message, data, timestamp }（拦截器已处理）。
- DB 访问仅通过 PrismaService 注入的 Service 层进行，不在 Controller 直连。
- DTO 放在各模块 dto/ 或 types/ 下，保持语义清晰与复用。

## 六、下一步增量（本轮执行项）

- 构建与快速冒烟
  - [ ] 执行构建，确认无 DI 错误（已补充 PrismaModule 引入）。备注：本轮按要求跳过执行。
  - [ ] 本地启动，调用商品详情、价格库存四接口做最小冒烟。备注：本轮按要求跳过执行。
- 单测补齐 ProductPricingService
  - [ ] getAvailability: 基本路径与 skuId 缺省路径（本轮跳过执行）
  - [ ] getAmount: 合法 sku 与非法 sku 混合（本轮跳过执行）
- 目录/命名清理（小步）
  - [x] 校验是否存在重复 HomeModule（src/home 与 src/content/home）；仅使用前台 Home 版本，避免命名冲突。（已确认非重复域，保持边界）
  - [ ] static/static 清理方案设计与引用清点，输出迁移补丁草案。（已开始清点：ServeStatic 以项目 static 为根挂载到 `/`，需保留 `/static/**` 兼容路径；代码与前端存在多处 `/static/mini/**` 与 admin/mobile 资产引用）

## 七、质量闸口与状态（本轮）

- Build：未执行（按用户要求跳过）；预计使用 `npm run build`。
- Lint：未执行；预计使用 `npm run lint`。
- Unit Tests：未执行（按用户要求跳过）。
- Smoke：未执行（推迟到下一轮）。

影响评估：本轮仅做文档与任务项更新，不涉及运行期变更。

下一步（下轮首要）：
- 先执行构建与最小冒烟，验证 Cron Facade 路径与商品详情/价格库存接口（见 docs/cron-smoke-checklist.md）。
- 输出 static/static 清理迁移草案与 ecard 导出命名统一补丁（见 docs/static-assets-migration.md 与 docs/ecard-naming-unification.md）。

附：本轮新增支持文档
- docs/static-assets-migration.md：静态资源目录精简与兼容迁移（草案）
- docs/ecard-naming-unification.md：电子卡券领域命名统一（草案）
- docs/cron-smoke-checklist.md：Cron 最小冒烟清单
