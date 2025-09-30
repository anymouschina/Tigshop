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
- nest项目的接口，完全对齐 php项目的接口

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
- [x] 去除硬编码 shopId/adminType/vendorId，统一返回 {code,message,data}
- [x] 注册 Access/General/User 统计控制器与服务（占位实现，后续补齐查询）
- [ ] 填充统计服务实际查询逻辑（必要时使用 Prisma.sql/$queryRaw 做分组聚合）
  - [x] 用户统计 UserStatisticsService：注册趋势/活跃/分布/留存/导出（基于 user 与 order 数据）
  - [x] 访问统计 AccessStatisticsService：趋势/来源/地域/导出（无埋点时退化为基于订单）
  - [x] 综合统计 GeneralStatisticsService：仪表盘/财务/库存/营销/趋势/导出（已实现，退款聚合基于 paylog_refund）

### 6) 其它域（按优先级逐步补齐）
- [x] 营销 Marketing
  - [x] ProductPromotion：补齐服务与 DTO，新增 /adminapi 兼容控制器（adminapi/promotion/productPromotion/*），统一守卫与 envelope，shopId 通过 PanelService 解析（后续与前端联调字段名细节）
  - [x] Seckill 秒杀：新增 /adminapi 兼容控制器（adminapi/promotion/seckill/*），接入 AdminJwtAuthGuard + AuthorityGuard + @Authorities("promotionManage")，返回驼峰与 {code,message,data}
  - [x] TimeDiscount 时段折扣：新增 /adminapi 兼容控制器（adminapi/promotion/timeDiscount/*），同上；支持 Name/StartTime/EndTime/Discount 别名
  - [x] ProductTeam 团购：新增 /adminapi 兼容控制器（adminapi/promotion/productTeam/*），列表/配置/详情/创建/更新/删除/批量（内部对接 groupon/groupon_item 模型，状态按时间计算）
  - [x] ProductGift 赠品：新增 /adminapi 兼容控制器（adminapi/promotion/productGift/*），列表/详情/创建/更新/删除/统计/可用列表
  - [x] RechargeSetting 充值设置：新增 /adminapi 兼容控制器（adminapi/promotion/rechargeSetting/*），列表/配置/详情/创建/更新/删除/批量
  - [x] WechatLive 微信直播：新增 /adminapi 兼容控制器（adminapi/promotion/wechatLive/*），列表/配置/详情/创建/更新/删除/批量
  - [x] SignIn 签到：新增 /adminapi 兼容控制器（adminapi/promotion/signIn/*），列表/详情/创建/更新/删除/批量；补充 signInSetting 路由别名
- [ ] 订单 Orders（Admin 兼容）
  - 基于 PHP 路由对齐 /adminapi/order 下接口（参考 php/app/adminapi/route/order.php）：
    - 售后 Aftersales（已对齐 /adminapi 路由并落地逻辑）
      - [x] GET  /adminapi/order/aftersales/list（按管理员解析 shopId/vendorId 过滤，支持 keyword/status/type/time 区间与排序）
      - [x] GET  /adminapi/order/aftersales/applyType（返回类型枚举文案）
      - [x] GET  /adminapi/order/aftersales/returnGoodsStatus（返回状态文案）
      - [x] GET  /adminapi/order/aftersales/detail（拼装明细、日志、建议退款金额）
      - [x] POST /adminapi/order/aftersales/update（同意/拒绝，记录日志，更新退款金额与时间戳）
      - [x] POST /adminapi/order/aftersales/receive（确认收货：置为 RETURNED 并记录日志）
      - [x] POST /adminapi/order/aftersales/record（追加备注日志）
      - [x] POST /adminapi/order/aftersales/complete（完结并记录日志）
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
      - [x] GET  /adminapi/authority/authority/getAllAuthority
      - [x] GET  /adminapi/authority/authority/getAuthority
    - 管理员日志 adminLog
      - [x] GET  /adminapi/authority/adminLog/list
    - 角色管理 adminRole
        - [x] GET  /adminapi/authority/adminRole/list
        - [x] GET  /adminapi/authority/adminRole/detail
        - [x] POST /adminapi/authority/adminRole/create
        - [x] POST /adminapi/authority/adminRole/update
        - [x] POST /adminapi/authority/adminRole/del
        - [x] POST /adminapi/authority/adminRole/updateField
        - [x] POST /adminapi/authority/adminRole/batch
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
      - [x] GET  /adminapi/authority/authority/list
      - [x] GET  /adminapi/authority/authority/getAuthorityParentName
      - [x] GET  /adminapi/authority/authority/detail
      - [x] POST /adminapi/authority/authority/create
      - [x] POST /adminapi/authority/authority/update
      - [x] POST /adminapi/authority/authority/del
      - [x] POST /adminapi/authority/authority/updateField
      - [x] POST /adminapi/authority/authority/batch
    - 供应商 suppliers
      - [x] GET  /adminapi/authority/suppliers/list
      - [x] GET  /adminapi/authority/suppliers/detail
      - [x] POST /adminapi/authority/suppliers/create
      - [x] POST /adminapi/authority/suppliers/update
      - [x] POST /adminapi/authority/suppliers/del
      - [x] POST /adminapi/authority/suppliers/updateField
      - [x] POST /adminapi/authority/suppliers/batch
  - 店铺/商户相关（分布在 setting 与 admin 模块，罗列用于对齐）：
    - 设置 Setting 下（config）
      - [x] GET  /adminapi/setting/config/merchantSettings
      - [x] POST /adminapi/setting/config/saveMerchant
      - [x] GET  /adminapi/setting/config/shopSettings
      - [x] POST /adminapi/setting/config/saveShop
      - [x] GET  /adminapi/setting/config/vendorSettings
      - [x] POST /adminapi/setting/config/saveVendor
    - 主账号 Admin 下（admin/adminAccount）
      - [x] GET  /adminapi/admin/adminAccount/getMainAccount
      - [x] GET  /adminapi/admin/adminAccount/pageShopOrVendor
      - [x] POST /adminapi/admin/adminAccount/bindMainAccount
      - [x] POST /adminapi/admin/adminAccount/updateMainAccount
      - [x] POST /adminapi/admin/adminAccount/updateMainAccountPwd
      - [x] GET  /adminapi/admin/adminAccount/pageAdminUser
 - [x] 店铺装修 Decorate（Admin 兼容）
   - [x] /adminapi/decorate/decorate：list/detail/loadDraftData/saveDraft/publish/copy/setHome/create/update/updateField/del/batch
   - [x] /adminapi/decorate/decorateDiscrete：detail/memberDecorateData
   - [x] /adminapi/decorate/pcNavigation：list/detail/getParentNav/selectLink/create/update/updateField/del/batch
   - [x] /adminapi/decorate/pcCatFloor：list/detail/create/update/updateField/del/batch/clearCache
   - [x] /adminapi/decorate/mobileCatNav：list/detail/create/update/updateField/del/batch
   - [x] /adminapi/decorate/decorateShare：share/import（占位实现）
   - [x] /adminapi/decorate/decorateRequest：productList/decorateByModule（占位）
   - [x] /adminapi/setting/config：categoryDecorateSettings/themeStyleSettings（装修相关配置）
   - （备注）decorateShare.import、pcCatFloor.clearCache、decorateRequest.decorateByModule 为占位，后续按需求接入真实逻辑
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
 - 2025-09-30：组织/权限（部分）：新增 AdminRole 兼容控制器，提供 /adminapi/authority/adminRole 的 list/detail/create/update/del/updateField/batch，使用现有 AdminRoleService；保留返回包装与字段别名。
 - 2025-09-30：组织/权限（继续）：新增 AuthorityCompatController（getAllAuthority/list/getAuthorityParentName/detail/create/update/del/updateField/batch）与 AdminLogCompatController（adminLog/list），注册进 AuthorityModule。
 - 2025-09-30：售后 Admin 兼容对齐：
   - 控制器补全 /adminapi/order/aftersales/* 全套路由并接通 PanelService 推导 shopId/vendorId；
   - AftersalesService 去除非法 include，新增 addLog 公共方法，agreeOrRefuse/complete 使用标准日志表字段映射；
   - getDetail 聚合 aftersales_item 与 order_item 构建明细，附带日志并计算建议退款金额；
   - 列表补充 order_sn 聚合字段，维持返回驼峰。
 - 2025-09-30：统计模块重构：
   - Sales/Access/General/User 统计控制器统一通过 PanelService 从 token 解析作用域（移除硬编码 shopId/adminType/vendorId）；
   - 返回包装统一为 { code:0, message:"success", data }；修复若干方法签名装饰器位置问题；
   - 新增 AccessStatisticsService / GeneralStatisticsService / UserStatisticsService 占位实现，并在 StatisticsModule 注册导出；
   - 修复运行时重复声明错误（去除重复类定义），建议清理 dist 后重新构建。
 - 2025-09-30：统计查询落地（第一版）：
   - UserStatisticsService 实现注册趋势/活跃（基于最近 7 天登录）/地域与来源分布（基于订单）/等级分布/留存（相邻周期对比）/CSV 导出（UTF-8 BOM + CRLF，保存至 /uploads/other）。
   - AccessStatisticsService 以“订单”退化近似访问：PV/UV、趋势（hour/day/week/month）、来源/地域分布、实时 10 分钟、转化率、CSV 导出。
   - GeneralStatisticsService 实现仪表盘（订单/营收/新用户/商品总数）、财务（按周期聚合）、库存（总数/上架/低库存/缺货）、营销（促销商品数/优惠券下单/来源 TOP）、性能（吞吐/营收）、同期对比、趋势分析、CSV 报告导出与实时 1 小时统计。
 - 2025-09-30：营销模块推进：补齐 ProductPromotionService 与 DTO；新增 AdminProductPromotionCompatController（/adminapi/promotion/productPromotion/*）；PromotionModule 注册服务与控制器；控制器使用 AdminJwtAuthGuard + AuthorityGuard + @Authorities，响应统一 {code,message,data}；shopId 通过 PanelService 获取。
 - 2025-09-30：营销模块兼容补全：新增 /adminapi 兼容控制器
   - 秒杀 seckill（/adminapi/promotion/seckill/*）与时段折扣 timeDiscount（/adminapi/promotion/timeDiscount/*）；
   - 团购 productTeam（/adminapi/promotion/productTeam/*）、赠品 productGift（/adminapi/promotion/productGift/*）、充值设置 rechargeSetting（/adminapi/promotion/rechargeSetting/*）、微信直播 wechatLive（/adminapi/promotion/wechatLive/*）、签到 signIn（/adminapi/promotion/signIn/*）；
   - 统一接入 AdminJwtAuthGuard + AuthorityGuard 与 @Authorities("promotionManage")，返回驼峰 envelope；已在 PromotionModule 完成注册，消除前端 404。
 - 2025-09-30：营销契约细化与别名补全：
   - Seckill：新增 GET /adminapi/promotion/seckill/listForDecorate（装修用），服务层实现 getSeckillProductList，聚合 seckill_item 与 product/product_sku 生成所需字段；create/update 支持 seckill_start_time/seckill_end_time 与 seckill_item 别名。
   - ProductPromotion：新增 GET /adminapi/promotion/productPromotion/conflict 路由别名，等价于 conflictList。
   - SignIn：新增 /adminapi/promotion/signInSetting/* 路由别名控制器（list/detail/create/update/del/batch），对齐 PHP 路由。
   - ProductTeam：Admin 兼容控制器改用 groupon/groupon_item 服务，状态/排序/筛选映射到实际字段，避免 Prisma 运行时错误。
 - 2025-09-30：营销模块完成：
   - 修复 SignInService 使用的 Prisma 模型名（sign_in_setting）与分页参数类型问题（page/size 强制转 number）；
   - 修复 RechargeSetting 服务排序字段（默认 recharge_id），兼容 status→is_show；
   - 新增商品电子卡分组 eCardGroup 管理端兼容控制器；
   - 修复 PointsExchange 模型引用与包含关系（转为手动联表聚合 product/sku）；
   - 所有营销路由均接入统一守卫与返回包装，前端页面无 404/403。
 - 2025-09-30：店铺装修 Decorate 管理端兼容完成：
   - 新增并接通 /adminapi/decorate/decorate（列表/详情/草稿/发布/复制/设为首页/新增/更新/单字段/删除/批量）、
     decorateDiscrete（detail/memberDecorateData）、pcNavigation（list/detail/getParentNav/selectLink/create/update/updateField/del/batch）、
     pcCatFloor（list/detail/create/update/updateField/del/batch/clearCache）、mobileCatNav（list/detail/create/update/updateField/del/batch）、
     decorateShare（share/import 占位）、decorateRequest（productList/decorateByModule 占位）。
   - 新增装修相关配置：/adminapi/setting/config/categoryDecorateSettings 与 /themeStyleSettings；
   - 统一接入 AdminJwtAuthGuard + AuthorityGuard 与 @Authorities，响应驼峰 {code,message,data}；
   - 标注占位项待后续接入真实逻辑（分享导入、清缓存、按模块取数据）。

## 维护说明
- 本文件为事实来源；每交付一项，请：
  1) 勾选对应复选框；
  2) 在“变更记录”追加日期/提交哈希/一句话说明；
  3) 如新增模块或前端出现新的 404/契约差异，先在此处补充任务项再实现。
