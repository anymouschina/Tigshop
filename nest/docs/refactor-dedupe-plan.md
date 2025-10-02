# Tigshop 重构与去重计划（前台商品域优先）

> 目的：收敛重复逻辑与分散职责，统一目录与命名规范，保证对前端协议无破坏的前提下，让项目结构更清晰、可维护。

更新时间：2025-10-02

## 一、已识别的重复/冗余点

- 路由/接口层
  - 规则：/api 与 /adminapi 前缀下的同名接口不视为重复，它们属于不同作用域（前台与后台），仅在职责越界或实现分散时需要收敛共享的 Service/DTO。
  - [ ] detail 与 public-detail 重复（同为公开接口，返回相同数据）。
  - [ ] 价格/库存能力在多个接口里重复实现和格式化（getProductAvailability / getProductAmount / getBatchProductAvailability / getPriceInBatches）。
  - [ ] 控制器中直接访问数据库（(service as any).prisma）违背分层，导致重复查询与难以复用。
  - [ ] promotion/getCoupon/isCollect/afterSalesService 等接口返回 Mock 数据，与对应模块职责重复/冲突。
- 业务逻辑层
  - [ ] 金额/重量/时间格式化多处重复（product-detail.service.ts、admin-product.controller.ts 等）。
  - [ ] 评论统计重复（detail service 手工统计 vs commentService.getCommentStats）。
  - [ ] 服务说明与电子卡券组逻辑分散（admin 已实现，前台 detail 未复用）。
  - [x] 依赖注入拆分后遗漏 PrismaModule 导致 CommentService 注入失败（已在 product/user 两处 CommentModule 补充 PrismaModule）。
- 目录/命名层
  - [ ] statistic/ 与 statistics/ 并存（职能相近）。
  - [ ] static/static/ 嵌套命名冗余。
  - [ ] src/app.contronller.ts 文件名拼写错误。
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

### 阶段3（目录与命名规范）
- [ ] 合并 statistic → statistics（或反向，以功能更全者为准），迁移并修正 import。
- [ ] 清理 static/static/ 冗余层级；如需，改为 static/assets。
- [ ] 修正文件名 app.contronller.ts → app.controller.ts，并更新引用。
- [ ] 统一电子卡券领域命名（Service/Module 导出保持 ecard 一致；Prisma 模型名保持表名即可）。

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
  - [ ] 覆盖基础单测
  - [ ] 在 Home 模块路径中验证 ProductModule 的导出是否满足使用方（如有多 HomeModule，保持仅引入 src/home/home.module.ts）
- 目录/命名清理
  - [ ] statistic/ 与 statistics/ 合并
  - [ ] static/static/ 清理
  - [x] app.contronller.ts 更名（已改为 app.controller.ts 并更新引用）
  - [ ] ecard 命名统一
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

## 五、参考与约定

- 统一响应壳：{ code, message, data, timestamp }（拦截器已处理）。
- DB 访问仅通过 PrismaService 注入的 Service 层进行，不在 Controller 直连。
- DTO 放在各模块 dto/ 或 types/ 下，保持语义清晰与复用。

## 六、下一步增量（本轮执行项）

- 构建与快速冒烟
  - [ ] 执行构建，确认无 DI 错误（已补充 PrismaModule 引入）。
  - [ ] 本地启动，调用商品详情、价格库存四接口做最小冒烟。
- 单测补齐 ProductPricingService
  - [ ] getAvailability: 基本路径与 skuId 缺省路径
  - [ ] getAmount: 合法 sku 与非法 sku 混合
- 目录/命名清理（小步）
  - [ ] 校验是否存在重复 HomeModule（src/home 与 src/content/home）；仅使用前台 Home 版本，避免命名冲突。
  - [ ] 评估 app.contronller.ts 更名影响范围，准备一次性改名提交。
