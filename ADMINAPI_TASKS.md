# Tigshop AdminAPI 兼容对齐任务清单

本清单用于逐步对齐 NestJS Admin API 与历史 PHP Admin 前端的接口契约，按模块列出任务项；完成后将打勾并在“变更记录”追加说明。欢迎按优先级持续更新。

- 记号说明：
  - [x] 已完成
  - [ ] 待办 / 进行中
  - （备注）补充必要上下文或对齐点

## 目标与范围
- 消除 Admin 前端常用页面的 404/403
- 对齐参数命名（camelCase/snake_case）、字段返回结构与业务语义
- 维持现有 Prisma 模式，避免与真实数据库列名不一致
- 对部分需要 CSV 的接口提供导出能力

## 进度清单

### 1) 基础与通用
- [x] 统一返回包装（已有拦截器，对新路由保持一致）
- [x] 管理端鉴权：AdminJwtAuthGuard + AuthorityGuard 在新增路由中接入
- [ ] Prisma 字段映射审计与修正（持续：跨模块核验 includes/select 与 snake_case 列名）
- [ ] 单元测试与冒烟脚本覆盖关键路由（list/detail/create/update/batch/export）

### 2) 设置 Setting / Config
- [x] /adminapi/setting/config 基本查询与保存能力（已存在）
- [ ] 配置项分组与初始化覆盖度核验（补文档/示例）

### 3) 素材库（Gallery）
- [x] /adminapi/setting/gallery/*
- [x] /adminapi/setting/galleryPic/*

### 4) 商品域（Product）
- Brand 品牌
  - [x] auditList 对齐缺失字段、状态文案
  - [x] update / updateField 兼容与类型强转
  - [x] 审核类业务异常使用框架异常（BadRequest/Forbidden 等）
- Category 分类
  - [x] 树/列表/详情/新增/更新/updateField/删除/移动（与 PHP 行为一致）
- 翻译（Translations）
  - [x] 翻译相关接口对齐（入参/出参一致）
- Product Group 商品分组（兼容 /adminapi/product/productGroup/*）
  - [x] 列表/详情/新增/更新/删除/批量
  - [x] POST :act 支持 save 别名（根据 id 有无判断 create/update）
  - [x] 保护“新品”“热卖”等内置名称的删除/批量删除
- Product Comment 商品评价（兼容 /adminapi/product/comment/*）
  - [x] 列表/详情/新增/更新/updateField/删除/批量/回复
  - [x] isShowed/is_showed 过滤与 -1 表示“不过滤”对齐 PHP
  - [x] show_pics 串行化存储、读取解析为数组；含“带图自动 is_showed=1”
- Product 列表
  - [x] ids 过滤器鲁棒解析（number/string/csv/array/JSON 皆可）
- Shipping 模板
  - [x] GET /adminapi/product/product/shippingTplList 返回 { records, total }
- Product Batch 批量（兼容 /adminapi/product/productBatch/*）
  - [x] 兼容路由存在：
    - POST productBatchDeal（处理提交，返回成功标记）
    - GET productBatchDeal（导出 CSV）
    - POST productBatchModify（多段上传场景的提交成功标记）
    - GET downloadTemplate（下载 CSV 模板）
    - POST productBatchEdit（批量编辑预处理成功标记）
  - [ ] 实际批量处理与编辑逻辑落地（解析上传文件/表格并应用到商品）
- Product Inventory Log 库存日志
  - [ ] /adminapi 前缀映射控制器（复用现有 admin/product 服务）
- Price Inquiry 询价
  - [ ] /adminapi 前缀映射控制器（复用现有 admin/product 服务）
- Product Attributes Template 属性模板
  - [ ] /adminapi 前缀映射控制器（复用现有 admin/product 服务）
- Product Services 售后服务
  - [x] /adminapi 前缀映射控制器（复用现有 admin/product 服务）

### 5) 统计与面板（Panel / Statistics）
- [x] 面板统计接口完善，含 CSV 导出
- [x] 对齐 PHP 查询参数与店铺作用域解析

### 6) 其它域（按优先级逐步补齐）
- [ ] 营销 Marketing
- [ ] 订单 Orders
- [ ] 组织/权限 Organization
- [ ] 店铺装修 Decorate
- [ ] 分销 Distribution
- [ ] 内容 Content
- [ ] 财务 Finance
- [ ] 会员 Member

### 7) 验证与发布
- [ ] 本地构建通过（pnpm build）
- [ ] 关键用例单测通过（pnpm test）
- [ ] Swagger /api-docs 出现新增路由且文档描述完整
- [ ] UI 冒烟：Admin 前端页面无 404/403，筛选与导出生效
- [ ] 文档：补 README 或 docs 对应章节

## 变更记录（完成项之后在此追加）
- 2025-09-29：创建本清单，勾选已完成模块（品牌、分类、翻译、素材库、商品分组、商品评价、商品列表 ids 过滤、ShippingTplList、ProductBatch 兼容路由、面板统计）。

## 维护说明
- 本文件为事实来源；每交付一项，请：
  1) 勾选对应复选框；
  2) 在“变更记录”追加日期/提交哈希/一句话说明；
  3) 如新增模块或前端出现新的 404/契约差异，先在此处补充任务项再实现。
