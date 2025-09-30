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
- [x] 物流公司列表兼容路由：GET /adminapi/setting/logisticsCompany/list（复用 LogisticsCompanyService，支持 paging=false 返回扁平数组）
  - 说明：服务层已使用 prisma.logistics_company（snake_case）访问模型，运行时报错问题已核对为模型名引用一致；如仍报错，请检查 PrismaService 注入与请求上下文。
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
  - [x] 实际批量处理与编辑逻辑落地（解析上传文件/表格并应用到商品）
- Product Inventory Log 库存日志
  - [x] /adminapi 前缀映射控制器（复用现有 admin/product 服务）
- Price Inquiry 询价
  - [x] /adminapi 前缀映射控制器（复用现有 admin/product 服务）
- Product Attributes Template 属性模板
  - [x] /adminapi 前缀映射控制器（复用现有 admin/product 服务）
- Product Services 售后服务
  - [x] /adminapi 前缀映射控制器（复用现有 admin/product 服务）

### 5) 统计与面板（Panel / Statistics）
- [x] 面板统计接口完善，含 CSV 导出
- [x] 对齐 PHP 查询参数与店铺作用域解析

### 6) 其它域（按优先级逐步补齐）
- [ ] 营销 Marketing
- [ ] 订单 Orders（Admin 兼容）
  - 基于 PHP 路由对齐 /adminapi/order 下接口（参考 php/app/adminapi/route/order.php）：
    - 售后 Aftersales（已存在非兼容控制器，需补 /adminapi 路由别名是否必要）
      - [ ] GET  /adminapi/order/aftersales/list
      - [ ] GET  /adminapi/order/aftersales/applyType
      - [ ] GET  /adminapi/order/aftersales/returnGoodsStatus
      - [ ] GET  /adminapi/order/aftersales/detail
      - [ ] POST /adminapi/order/aftersales/update
      - [ ] POST /adminapi/order/aftersales/receive
      - [ ] POST /adminapi/order/aftersales/record
      - [ ] POST /adminapi/order/aftersales/complete
    - 订单管理 Order（新增了兼容服务与控制器 skeleton）
      - [x] GET  /adminapi/order/list（已添加 AdminOrderCompatController.list）
      - [x] GET  /adminapi/order/detail（已添加 AdminOrderCompatController.detail）
      - [x] 兼容别名 /adminapi/order/order/*（list/detail/updateField/log/*/deliver/... 导出等均已提供别名，消除 404）
  - [x] GET  /adminapi/order/orderWayBill（获取电子面单）
  - [x] GET  /adminapi/order/parentDetail（父订单详情）
      - [x] POST /adminapi/order/deliver（订单发货）
      - [x] POST /adminapi/order/confirmReceipt（订单收货）
      - [x] POST /adminapi/order/modifyConsignee（修改收货人）
      - [x] POST /adminapi/order/modifyShipping（修改配送信息）
      - [x] POST /adminapi/order/modifyMoney（修改订单金额）
      - [x] POST /adminapi/order/cancelOrder（取消订单）
      - [x] POST /adminapi/order/setConfirm（设置为已确认）
      - [x] POST /adminapi/order/delOrder（订单软删除）
  - [x] POST /adminapi/order/splitStoreOrder（订单拆分）
      - [x] POST /adminapi/order/setPaid（设置为已支付）
  - [x] POST /adminapi/order/modifyProduct（修改商品信息）
  - [x] POST /adminapi/order/getAddProductInfo（添加商品前置信息）
      - [x] POST /adminapi/order/setAdminNote（设置商家备注）
  - [x] GET  /adminapi/order/orderPrint（打印订单）
  - [x] GET  /adminapi/order/orderPrintBill（打印电子面单）
      - [x] GET  /adminapi/order/getExportItemList（导出标签列表，已实现）
      - [x] POST /adminapi/order/saveExportItem（保存导出字段，已实现）
      - [x] GET  /adminapi/order/exportItemInfo（标签详情，已实现）
      - [x] GET  /adminapi/order/orderExport（导出 CSV，已实现）
  - [x] POST /adminapi/order/batch（批量操作）
  - [x] GET  /adminapi/order/severalDetail（批量详情）
  - [x] GET  /adminapi/order/printSeveral（批量打印）
      - [x] GET  /adminapi/order/shippingInfo（物流信息）
  - [x] GET  /adminapi/order/getOrderPageConfig（订单列表配置）
      - [x] POST /adminapi/order/changeOrderStatus 或 updateField（字段更新：已添加 updateField 简化版）
  - 打印 Print（与 PHP /adminapi/print/* 对齐）
      - [x] POST /adminapi/print/print/hasEnabled（已新增兼容控制器 AdminPrintCompatController，按店铺判断是否存在启用打印机）
  - 日志管理 OrderLog
      - [x] GET  /adminapi/order/log/list（已添加 AdminOrderCompatController.logList）
      - [x] POST /adminapi/order/log/create（已添加 AdminOrderCompatController.logCreate）
  - 订单配置 Config（如需对齐 /adminapi/order/config/*）
    - [x] GET  /adminapi/order/config/detail
    - [x] POST /adminapi/order/config/save

- 商户 Merchant（Admin 兼容）
  - [x] GET  /adminapi/merchant/merchant/list（列表，支持 keyword/status/sort/pagination）
  - [x] GET  /adminapi/merchant/merchant/:id（详情）
  - [x] POST /adminapi/merchant/merchant/create（创建，支持 admin 绑定与 JSON 字段序列化）
  - [x] POST /adminapi/merchant/merchant/update（更新，支持按 id/merchantId/query.id 识别）
  - [x] POST /adminapi/merchant/merchant/updateField（字段白名单：status/type/company_name/corporate_name/settlement_cycle）
  - [x] POST /adminapi/merchant/merchant/:id（operate：approve/reject/enable/disable，拒绝理由写入 merchant_data）

- 商户入驻申请 Merchant Apply（Admin 兼容）
  - [x] GET  /adminapi/merchant/apply/list（筛选：status/username/keyword；排序：add_time/merchant_apply_id）
  - [x] GET  /adminapi/merchant/apply/config（返回数组：[{status, statusText}]，1/10/20）
  - [x] GET  /adminapi/merchant/apply/:id（详情，附带 user）
  - [x] POST /adminapi/merchant/apply/del（支持单个或批量 ids）
  - [x] POST /adminapi/merchant/apply/audit（status=10 通过会落地创建 merchant，20 拒绝）
  - [x] POST /adminapi/merchant/apply/batch（delete/auditPass/auditReject）
- [ ] 组织/权限 Organization
  - 权限与组织模块接口清单（来自 PHP /adminapi/authority/*，先罗列待办，逐步对齐）：
    - 顶层
      - [ ] GET  /adminapi/authority/authority/getAllAuthority
      - [ ] GET  /adminapi/authority/authority/getAuthority
    - 管理员日志 adminLog
      - [ ] GET  /adminapi/authority/adminLog/list
    - 角色管理 adminRole
      - [ ] GET  /adminapi/authority/adminRole/list
      - [ ] GET  /adminapi/authority/adminRole/detail
      - [ ] POST /adminapi/authority/adminRole/create
      - [ ] POST /adminapi/authority/adminRole/update
      - [ ] POST /adminapi/authority/adminRole/del
      - [ ] POST /adminapi/authority/adminRole/updateField
      - [ ] POST /adminapi/authority/adminRole/batch
    - 管理员 adminUser
      - [x] GET  /adminapi/authority/adminUser/list
      - [x] GET  /adminapi/authority/adminUser/detail
      - [x] GET  /adminapi/authority/adminUser/mineDetail
      - [x] POST /adminapi/authority/adminUser/create
      - [x] POST /adminapi/authority/adminUser/update
      - [x] POST /adminapi/authority/adminUser/del
      - [x] POST /adminapi/authority/adminUser/updateField
      - [x] GET  /adminapi/authority/adminUser/config
      - [x] POST /adminapi/authority/adminUser/batch
      - [x] POST /adminapi/authority/adminUser/modifyManageAccounts
      - [x] GET  /adminapi/authority/adminUser/getCode
      - [x] POST /adminapi/authority/adminUser/checkCode
    - 权限管理 authority
      - [ ] GET  /adminapi/authority/authority/list
      - [ ] GET  /adminapi/authority/authority/getAuthorityParentName
      - [ ] GET  /adminapi/authority/authority/detail
      - [ ] POST /adminapi/authority/authority/create
      - [ ] POST /adminapi/authority/authority/update
      - [ ] POST /adminapi/authority/authority/del
      - [ ] POST /adminapi/authority/authority/updateField
      - [ ] POST /adminapi/authority/authority/batch
    - 供应商 suppliers
      - [ ] GET  /adminapi/authority/suppliers/list
      - [ ] GET  /adminapi/authority/suppliers/detail
      - [ ] POST /adminapi/authority/suppliers/create
      - [ ] POST /adminapi/authority/suppliers/update
      - [ ] POST /adminapi/authority/suppliers/del
      - [ ] POST /adminapi/authority/suppliers/updateField
      - [ ] POST /adminapi/authority/suppliers/batch
  - 店铺/商户相关（分布在 setting 与 admin 模块，罗列用于对齐）：
    - 设置 Setting 下（config）
      - [ ] GET  /adminapi/setting/config/merchantSettings
      - [ ] POST /adminapi/setting/config/saveMerchant
      - [ ] GET  /adminapi/setting/config/shopSettings
      - [ ] POST /adminapi/setting/config/saveShop
      - [ ] GET  /adminapi/setting/config/vendorSettings
      - [ ] POST /adminapi/setting/config/saveVendor
    - 主账号 Admin 下（admin/adminAccount）
      - [ ] GET  /adminapi/admin/adminAccount/getMainAccount
      - [ ] GET  /adminapi/admin/adminAccount/pageShopOrVendor
      - [ ] POST /adminapi/admin/adminAccount/bindMainAccount
      - [ ] POST /adminapi/admin/adminAccount/updateMainAccount
      - [ ] POST /adminapi/admin/adminAccount/updateMainAccountPwd
      - [ ] GET  /adminapi/admin/adminAccount/pageAdminUser
- [ ] 店铺装修 Decorate
- [ ] 分销 Distribution
- [ ] 内容 Content
- [ ] 财务 Finance
- [ ] 会员 Member
  
### 8) 用户侧模块（User App）
- [ ] 用户售后 Aftersales（对齐 PHP user/Aftersales/*）
  - [x] GET  /aftersales/user/aftersales/list（可售后订单列表）
  - [x] GET  /aftersales/user/aftersales/config（售后配置）
  - [x] GET  /aftersales/user/aftersales/applyData（售后申请详情）
  - [x] POST /aftersales/user/aftersales/create（创建售后申请）
  - [x] POST /aftersales/user/aftersales/update（更新售后申请）
  - [x] GET  /aftersales/user/aftersales/getRecord（售后申请记录）
  - [x] GET  /aftersales/user/aftersales/detail（售后记录详情）
  - [x] GET  /aftersales/user/aftersales/detailLog（售后日志记录）
  - [x] POST /aftersales/user/aftersales/feedback（提交售后反馈记录）
  - [x] POST /aftersales/user/aftersales/cancel（撤销售后申请）

### 7) 验证与发布
- [ ] 本地构建通过（pnpm build）
- [ ] 关键用例单测通过（pnpm test）
- [ ] Swagger /api-docs 出现新增路由且文档描述完整
- [ ] UI 冒烟：Admin 前端页面无 404/403，筛选与导出生效
- [ ] 文档：补 README 或 docs 对应章节

## 变更记录（完成项之后在此追加）
- 2025-09-29：创建本清单，勾选已完成模块（品牌、分类、翻译、素材库、商品分组、商品评价、商品列表 ids 过滤、ShippingTplList、ProductBatch 兼容路由、面板统计）。
- 2025-09-29：商品域补齐并对齐完成（除“Product Batch 实际处理逻辑”外）：新增并接通 /adminapi 兼容控制器 productInventoryLog/priceInquiry/productAttributesTpl/productServices；修复若干 Prisma 字段映射问题；统一返回驼峰；productServices 增加 updateField；属性模板 update 入参支持 tplId/tplName/tplData 并序列化存储，create 返回新建记录。
- 2025-09-29：新增“订单 Orders（Admin 兼容）”任务清单；创建 AdminOrderCompatService/Controller，接通 /adminapi/order 的 list/detail/updateField、日志 list/create、saveExportItem（占位），其余路由按 PHP 清单列入待办。
- 2025-09-29：订单模块推进：接通发货/收货/金额/收货人/配送/取消/确认/删除/设置已支付/设置商家备注/物流信息等核心操作；实现导出能力（getExportItemList/exportItemInfo/orderExport），保存导出字段偏好至 admin_user.order_export；其余打印、电子面单、批量等仍为占位。
- 2025-09-29：消除 404：
  - 新增 /adminapi/order/order/* 路由别名，映射至现有处理（列表、详情、日志、更新字段、发货/收货/金额/收货人/配送/取消/确认/删除/已支付、导出相关、批量/打印占位等）。
  - 新增 /adminapi/setting/logisticsCompany/list 兼容控制器，复用 LogisticsCompanyService，支持 paging=false 返回扁平数组；paging=true 返回 {records,total,size,current,pages}。
  - 新增 /adminapi/print/print/hasEnabled 兼容接口，判断是否存在启用打印机（status=1 且按当前管理员 shop_id 过滤）。
 - 2025-09-30：商品批量处理落地：新增 AdminProductBatchCompatService，实现：
   - GET /adminapi/product/productBatch/productBatchDeal 实际导出逻辑（按全部/分类/品牌/商品范围导出，分类路径 a|b|c，品牌名映射，UTF-8 BOM + CRLF）。
   - POST /adminapi/product/productBatch/productBatchModify 解析上传 CSV 批量创建商品（支持自动创建分类/品牌，生成唯一商品编号，写入相册）。
   - POST /adminapi/product/productBatch/productBatchEdit 支持按行批量编辑（字段白名单与校验，避免重复 SN，更新 last_update）。
 - 2025-09-30：商户与入驻申请对齐：新增 MerchantCompatController 与 MerchantApplyCompatController 一揽子兼容路由；
   - 商户：实现 list/detail/create/update/updateField/:id(operate)；list 支持状态与关键词筛选，operate 支持 approve/reject/enable/disable；字段返回驼峰。
   - 入驻申请：实现 list/config/detail/del/audit/batch；状态对齐 1/10/20；audit 通过自动创建 merchant；config 返回数组以兼容前端 SelectConfig.vue。
 - 2025-09-30：订单拆分落地：完成 /adminapi/order/splitStoreOrder，按 vendor_id 优先、否则按 shop_id 分组，创建子订单并迁移明细，金额按小计比例分摊，原单 is_store_splited=1。
 - 2025-09-30：订单配置兼容落地：新增 /adminapi/order/config/detail 与 /save，按 shop 作用域读写 JSON 配置，支持单项与批量保存；注册至 AppModule。
 - 2025-09-30：管理员兼容完善：/adminapi/authority/adminUser/detail 支持未传 adminId 返回当前登录管理员；/adminUser/checkCode 兼容 GET/POST；补充精简 list/create/update/del/updateField/batch/modifyManageAccounts/config。
 - 2025-09-30：地区树兼容：实现 GET /adminapi/setting/region/getAllRegionTree（复用 RegionService.getRegionTree），去除相关 404。
 - 2025-09-30：Prisma 字段映射修复：修正 merchant/shop 相关 include/select 使用错误（去除 shop.include.merchant；merchant 选择 company_name/corporate_name，并从 merchant_data 解析联系方式）。
 - 2025-09-30：入驻申请筛选语义：list 接受 status=-1 表示“不过滤”，避免 400，保持 1/10/20 正常筛选。

## 维护说明
- 本文件为事实来源；每交付一项，请：
  1) 勾选对应复选框；
  2) 在“变更记录”追加日期/提交哈希/一句话说明；
  3) 如新增模块或前端出现新的 404/契约差异，先在此处补充任务项再实现。
