# Tigshop UserAPI 接口清单（基于 PHP /api）

本清单从 `php/app/api/route/*.php` 路由文件梳理而来，覆盖用户侧全部以 `/api/` 开头的接口，按模块分组，标注方法与是否需登录（CheckLogin 中间件）。用于与 Nest 实现对齐、迁移跟踪与联调。

- 记号说明：
  - [ ] 待对齐/未实现
  - [x] 已对齐/已实现（后续按进度勾选，并在变更记录补充说明）
  - 需登录：接口所在分组挂载 `\app\api\middleware\CheckLogin::class`

- 路由来源：ThinkPHP 路由定义（`php/app/api/route/*.php`）
- 路由前缀：统一为 `/api/`（以下清单已包含完整路径）

## 目录
- common（公共）
- article（文章）
- cart（购物车）
- category（分类）
- decorate（装修离散）
- home（首页/装修分享）
- order（订单结算/支付）
- product（商品/兑换）
- search（搜索）
- sys（系统/地区）
- user（会员中心）
- appVersion（应用版本）

---

## common（公共）

- config（配置）
  - [x] GET /api/common/config/base
  - [x] GET /api/common/config/initConfigSettings（同 base）
  - [x] GET /api/common/config/themeSettings
  - [x] GET /api/common/config/mobileAreaCode
  - [x] GET /api/common/config/afterSalesService
- log
  - [x] GET /api/common/log
- pc（PC 站）
  - [x] GET /api/common/pc/getHeader
  - [x] GET /api/common/pc/getNav
  - [x] GET /api/common/pc/getCatFloor
- util（工具）
  - [x] GET /api/common/util/qrCode
  - [x] GET /api/common/util/miniCode
- recommend（推荐位）
  - [x] GET /api/common/recommend/guessLike
  - [x] GET /api/common/recommend/getProductIds
 - currency（货币）
  - [x] GET /api/common/currency/getCurrency
  - verification（验证码）
    - [x] POST /api/common/verification/captcha
    - [x] POST /api/common/verification/check
    - [x] POST /api/common/verification/verification
  - [x] GET /api/common/csrf/create

## article（文章）
  - [x] GET /api/article/article/list
  - [x] GET /api/article/article/newsInfo
  - [x] GET /api/article/article/issueInfo
  - [x] GET /api/article/category/list
  - [x] GET /api/article/category/indexBzzxList

- cart
    - [x] GET  /api/cart/cart/list（需登录）
    - [x] GET  /api/cart/cart/getCount（需登录）
    - [x] POST /api/cart/cart/updateCheck（需登录）
    - [x] POST /api/cart/cart/updateItem（需登录）
    - [x] POST /api/cart/cart/removeItem（需登录）
    - [x] POST /api/cart/cart/clear（需登录）
    - [x] GET  /api/cart/cart/getCouponDiscount（需登录）
    - [x] POST /api/cart/cart/addToCart（需登录）

## category（分类）
    - [x] GET /api/category/category/parentTree
    - [x] GET /api/category/category/all
    - [x] GET /api/category/category/list
    - [x] GET /api/category/category/relateInfo
    - [x] GET /api/category/category/getRelateCategory（PHP 方法名 getRelateCategory）
    - [x] GET /api/category/category/getRelateBrand（PHP 方法名 getRelateBrand）
    - [x] GET /api/category/category/relateRank
    - [x] GET /api/category/category/relateArticle
    - [x] GET /api/category/category/relateLookAlso
    - [x] GET /api/category/category/hot
  - [x] GET /api/category/category/relateLookAlso
  - [x] GET /api/category/category/hot
    - [x] GET /api/decorate/discrete/getOpenAdvertising
## decorate（装修离散）

- discrete
  - [x] GET /api/decorate/discrete/getOpenAdvertising
    - [x] GET  /api/product/product/detail
    - [x] GET  /api/product/product/getComment
    - [x] GET  /api/product/product/getCommentList
    - [x] GET  /api/product/product/getFeedbackList
    - [x] GET  /api/product/product/getProductAvailability
    - [x] GET  /api/product/product/getBatchProductAvailability
  - [x] POST /api/product/product/getPriceInBatches
    - [x] POST /api/product/product/getProductAmount
    - [x] GET  /api/product/product/list
    - [x] GET  /api/product/product/getCoupon
    - [x] GET  /api/product/product/isCollect
    - [x] POST /api/product/product/promotion
    - [x] GET  /api/product/product/getRelated
  - [x] GET /api/home/home/friendLinks
- share（装修模板导入）
  - [x] GET /api/home/share/import

    - [x] GET /api/search/search/getFilter
    - [x] GET /api/search/search/getProduct
- check（结算，需登录）
  - [x] POST /api/order/check/index（需登录）
    - [x] GET /api/user/account/list（需登录）
  - [x] POST /api/order/check/updateCoupon（需登录）
  - [x] POST /api/order/check/submit（需登录）
    - [x] GET  /api/user/address/list（需登录）
    - [x] GET  /api/user/address/detail（需登录）
    - [x] POST /api/user/address/create（需登录）
    - [x] POST /api/user/address/update（需登录）
    - [x] POST /api/user/address/del（需登录）
    - [x] POST /api/user/address/setSelected（需登录）
  - [x] GET  /api/order/pay/getPayLog
  - [x] GET  /api/order/pay/create
    - [x] GET  /api/user/login/getQuickLoginSetting
    - [x] POST /api/user/login/signin
    - [x] POST /api/user/login/sendMobileCode
## product（商品/兑换）

    - [x] GET  /api/user/order/list（需登录）
    - [x] GET  /api/user/order/detail（需登录）
    - [x] GET  /api/user/order/orderNum（需登录）
    - [x] POST /api/user/order/cancelOrder（需登录）
    - [x] POST /api/user/order/delOrder（需登录）
    - [x] POST /api/user/order/confirmReceipt（需登录）
    - [x] GET  /api/user/order/shippingInfo（需登录）
    - [x] POST /api/user/order/buyAgain（需登录）
  - [x] GET  /api/product/product/getFeedbackList
  - [x] GET  /api/product/product/getProductAvailability
    - [x] POST /api/user/regist/registAct
    - [x] POST /api/user/regist/sendEmailCode
  - [x] POST /api/product/product/getProductAmount
  - [x] GET  /api/product/product/list
  - [x] GET  /api/product/product/getCoupon
  - [x] GET  /api/product/product/isCollect
  - [x] POST /api/product/product/promotion
  - [x] GET  /api/product/product/getRelated

## search（搜索）

- search
  - [x] GET /api/search/search/getFilter
  - [x] GET /api/search/search/getProduct
- searchGuess（关键词）
  - [x] GET /api/search/searchGuess/index

## sys（系统/地区）

- region
  - [x] GET /api/sys/region/getRegion
  - [x] GET /api/sys/region/getProvinceList
  - [x] GET /api/sys/region/getUserRegion

## user（会员中心）

- account（账户明细，需登录）
  - [x] GET /api/user/account/list（需登录）
- address（收货地址，需登录）
  - [x] GET  /api/user/address/list（需登录）
  - [x] GET  /api/user/address/detail（需登录）
  - [x] POST /api/user/address/create（需登录）
  - [x] POST /api/user/address/update（需登录）
  - [x] POST /api/user/address/del（需登录）
  - [x] POST /api/user/address/setSelected（需登录）
- aftersales（售后，需登录）
  - [x] GET  /api/user/aftersales/list（需登录）
  - [x] GET  /api/user/aftersales/config（需登录）
  - [x] GET  /api/user/aftersales/applyData（需登录，基础占位数据）
  - [x] POST /api/user/aftersales/create（需登录）
  - [x] POST /api/user/aftersales/update（需登录）
  - [x] GET  /api/user/aftersales/getRecord（需登录）
  - [x] GET  /api/user/aftersales/detail（需登录）
  - [x] GET  /api/user/aftersales/detailLog（需登录，占位返回空列表）
  - [x] POST /api/user/aftersales/feedback（需登录，占位返回成功）
  - [x] POST /api/user/aftersales/cancel（需登录）
- collectProduct（收藏，需登录）
  - [x] GET  /api/user/collectProduct/list（需登录）
  - [x] POST /api/user/collectProduct/save（需登录）
  - [x] POST /api/user/collectProduct/cancel（需登录）
- comment（评论晒单，需登录）
  - [x] GET  /api/user/comment/subNum（需登录）
  - [x] GET  /api/user/comment/showedList（需登录）
  - [x] GET  /api/user/comment/list（需登录）
  - [x] POST /api/user/comment/evaluate（需登录）
  - [x] GET  /api/user/comment/detail（需登录）
- coupon（优惠券）
  - [x] GET  /api/user/coupon/list（需登录）
  - [x] POST /api/user/coupon/del（需登录）
  - [x] GET  /api/user/coupon/getList
  - [x] POST /api/user/coupon/claim（需登录）
  - [x] GET  /api/user/coupon/detail（需登录）
- feedback（留言咨询，需登录）
  - [x] GET  /api/user/feedback/list（需登录）
  - [x] POST /api/user/feedback/submit（需登录）
- invoice（增票资质，需登录）
  - [x] GET  /api/user/invoice/detail（需登录）
  - [x] POST /api/user/invoice/create（需登录）
  - [x] POST /api/user/invoice/update（需登录）
  - [x] GET  /api/user/invoice/getStatus（需登录）
- login（登录/验证码/微信授权等）
  - [x] GET  /api/user/login/getQuickLoginSetting
  - [x] POST /api/user/login/signin
  - [x] POST /api/user/login/sendMobileCode
  - [x] POST /api/user/login/checkMobile
  - [x] POST /api/user/login/checkEmail
  - [x] POST /api/user/login/forgetPassword
  - [x] GET  /api/user/login/getWxLoginUrl（兼容 getWechatLoginUrl）
  - [x] GET  /api/user/login/getWxLoginInfoByCode（兼容 getWechatLoginInfoByCode）
  - [x] POST /api/user/login/bindMobile
  - [x] POST /api/user/login/bindWechat（需登录）
  - [x] GET  /api/user/login/unbindWechat（需登录，兼容 GET，原实现为 POST）
  - [x] GET  /api/user/login/wechatServer（兼容 GET wechatServerVerify）
  - [x] POST /api/user/login/wechatServer（兼容 POST getWechatMessage）
  - [x] POST /api/user/login/wechatEvent（兼容 GET wechatEvent）
  - [x] POST /api/user/login/getMobile（兼容 getUserMobile）
  - [x] POST /api/user/login/updateUserOpenId（需登录）
  - [x] POST /api/user/login/getJsSdkConfig（需登录，兼容 POST；原实现亦提供 GET）
  - [x] POST /api/user/login/sendEmailCode
- message（站内信，需登录）
  - [x] GET  /api/user/message/list（需登录）
  - [x] POST /api/user/message/updateAllRead（需登录）
  - [x] POST /api/user/message/updateMessageRead（需登录）
  - [x] POST /api/user/message/del（需登录）
- order（订单，需登录）
  - [x] GET  /api/user/order/list（需登录）
  - [x] GET  /api/user/order/detail（需登录）
  - [x] GET  /api/user/order/orderNum（需登录）
  - [x] POST /api/user/order/cancelOrder（需登录）
  - [x] POST /api/user/order/delOrder（需登录）
  - [x] POST /api/user/order/confirmReceipt（需登录）
  - [x] GET  /api/user/order/shippingInfo（需登录）
  - [x] POST /api/user/order/buyAgain（需登录）
- orderInvoice（订单发票，需登录）
  - [x] GET  /api/user/orderInvoice/detail（需登录）
  - [x] POST /api/user/orderInvoice/create（需登录）
  - [x] POST /api/user/orderInvoice/update（需登录）
- pointsLog（积分，需登录）
  - [x] GET  /api/user/pointsLog/list（需登录）
- rechargeOrder（充值，需登录）
  - [x] GET  /api/user/rechargeOrder/list（需登录）
  - [x] POST /api/user/rechargeOrder/update（需登录）
  - [x] GET  /api/user/rechargeOrder/setting（需登录）
  - [x] GET  /api/user/rechargeOrder/paymentList（需登录）
  - [x] POST /api/user/rechargeOrder/pay（需登录）
  - [x] POST /api/user/rechargeOrder/create（需登录）
  - [x] GET  /api/user/rechargeOrder/checkStatus（需登录）
- regist（注册）
  - [ ] POST /api/user/regist/registAct
  - [ ] POST /api/user/regist/sendEmailCode
- user（会员资料，需登录）
  - [ ] GET  /api/user/user/detail（需登录）
  - [ ] POST /api/user/user/updateInformation（需登录）
  - [ ] GET  /api/user/user/memberCenter（需登录）
  - [ ] POST /api/user/user/oAuth（需登录）
  - [ ] POST /api/user/user/sendMobileCodeByModifyPassword（需登录）
  - [ ] POST /api/user/user/checkModifyPasswordMobileCode（需登录）
  - [ ] POST /api/user/user/modifyPassword（需登录）
  - [ ] POST /api/user/user/sendMobileCodeByMobileValidate（需登录）
  - [ ] POST /api/user/user/sendEmailCodeByEmailValidate（需登录）
  - [ ] POST /api/user/user/sendMobileCodeByModifyMobile（需登录）
  - [ ] POST /api/user/user/sendEmailCodeByModifyEmail（需登录）
  - [ ] POST /api/user/user/modifyMobile（需登录）
  - [ ] POST /api/user/user/modifyEmail（需登录）
  - [ ] POST /api/user/user/mobileValidate（需登录）
  - [ ] POST /api/user/user/emailValidate（需登录）
  - [ ] POST /api/user/user/emailValidateNew（需登录）
  - [ ] GET  /api/user/user/historyProduct（需登录）
  - [ ] POST /api/user/user/delHistoryProduct（需登录）
  - [ ] POST /api/user/user/uploadImg（需登录）
  - [ ] POST /api/user/user/modifyAvatar（需登录）
  - [ ] GET  /api/user/user/collectionShop（需登录）
  - [ ] GET  /api/user/user/levelList（需登录）
  - [ ] GET  /api/user/user/levelInfo（需登录）
  - [ ] POST /api/user/user/logout（需登录）
  - [ ] POST /api/user/user/close（需登录）
  - [ ] GET  /api/user/user/userOpenId（需登录）
- withdrawApply（提现，需登录）
  - [x] GET  /api/user/withdrawApply/list（需登录）
  - [x] POST /api/user/withdrawApply/createAccount（需登录）
  - [x] POST /api/user/withdrawApply/updateAccount（需登录）
  - [x] GET  /api/user/withdrawApply/accountDetail（需登录）
  - [x] POST /api/user/withdrawApply/delAccount（需登录）
  - [x] POST /api/user/withdrawApply/apply（需登录）
- sign（签到，需登录）
  - [x] GET  /api/user/sign/index（需登录）
  - [x] GET  /api/user/sign/sign（需登录）
- company（企业认证，需登录）
  - [x] POST /api/user/company/apply（需登录）
  - [x] GET  /api/user/company/detail（需登录）
  - [x] GET  /api/user/company/myApply（需登录）
- oauth（第三方登录）
  - [x] GET  /api/user/oauth/render/:source（当前支持 wechat）
  - [x] POST /api/user/oauth/callback/:source（当前支持 wechat）

## appVersion（应用版本）

- [x] POST /api/appVersion/getAppUpdate

---

## 下一步（建议）
- 在 Nest 下新增 `user-app` 对齐任务模块，逐步接通以上路由（命名与参数保持与 PHP 一致，注意返回包装 `{ code, message, data }`）。
- 优先项：
  - 登录/注册/验证码流（/api/user/login/*、/api/user/regist/*）。
  - 会员基础信息与登出（/api/user/user/detail、logout、updateInformation）。
  - 订单结算/支付（/api/order/check/*、/api/order/pay/*）。
  - 购物车（/api/cart/cart/*）。
- 将对齐状态在本文件对应项勾选，并在“变更记录”记录日期与说明。

## 变更记录
- 2025-10-01：首次从 PHP 路由梳理完整 /api 清单并入库（文件来源：php/app/api/route）。

---

## Nest 覆盖度扫描结果（初步）

以下为基于当前 Nest 源码（nest/src/**）的快速比对，仅统计控制器路径即为 /api/... 的接口；如存在路径不完全一致但功能等价的实现，已在备注中说明。

- 已存在（路径对齐 /api/...）：
  - common
    - GET /api/common/log（LogController）
    - GET /api/common/recommend/getProductIds（RecommendController）
    - common/config（CommonConfigController）：
      - GET /api/common/config/themeSettings
      - GET /api/common/config/initConfigSettings
      - GET /api/common/config/mobileAreaCode
    - common/verification（PublicVerificationController）：
      - POST /api/common/verification/captcha
      - POST /api/common/verification/check（兼容前端验证接口）
  - decorate
    - GET /api/decorate/discrete/getOpenAdvertising（UserDecorateController）
    - GET /api/category/category/parentTree
    - GET /api/category/category/all
    - GET /api/category/category/list
    - [x] GET /api/common/pc/getHeader
    - [x] GET /api/common/pc/getNav
    - [x] GET /api/common/pc/getCatFloor
    - GET /api/category/category/getRelateCategory
    - GET /api/category/category/getRelateBrand
    - [x] GET /api/common/util/qrCode
    - [x] GET /api/common/util/miniCode
    - GET /api/category/category/getRelateArticle
    - GET /api/category/category/getRelateRank
    - GET /api/category/category/getRelateLookAlso
    - GET /api/category/category/hot
  - search（SearchController）
    - GET /api/search/search/getFilter
    - GET /api/search/search/getProduct
  - cart（CartController，需登录）
    - GET  /api/cart/cart/list
    - GET  /api/cart/cart/getCount
    - POST /api/cart/cart/updateCheck
    - POST /api/cart/cart/updateItem
    - POST /api/cart/cart/removeItem
    - POST /api/cart/cart/clear
    - GET  /api/cart/cart/getCouponDiscount
    - POST /api/cart/cart/addToCart
  - product（ProductController）
    - GET  /api/product/product/list
    - GET  /api/product/product/detail
    - GET  /api/product/product/getComment
    - GET  /api/product/product/getCommentList
    - GET  /api/product/product/getFeedbackList
    - GET  /api/product/product/getProductAvailability
    - GET  /api/product/product/getBatchProductAvailability
    - POST /api/product/product/getProductAmount
    - GET  /api/product/product/getCoupon
    - GET  /api/product/product/isCollect
    - POST /api/product/product/promotion
    - GET  /api/product/product/getRelated
    - 备注：售后政策接口存在于 GET /api/product/product/afterSalesService（非 common/config 路径）
  - user 注册/账户/订单/地址等（部分，需登录）
    - POST /api/user/regist/registAct（UserController）
    - POST /api/user/regist/sendEmailCode（UserController）
    - GET  /api/user/user/detail（UserController）
    - GET  /api/user/account/list（UserController）
    - 订单（OrderController）
      - GET  /api/user/order/list
      - GET  /api/user/order/detail
      - GET  /api/user/order/orderNum
      - POST /api/user/order/cancelOrder
      - POST /api/user/order/delOrder
      - POST /api/user/order/confirmReceipt
      - GET  /api/user/order/shippingInfo
      - POST /api/user/order/buyAgain

- 存在但路径不完全一致（需调整对齐）：
  - user/login 部分接口当前路径为 /api/user/user/login/...，应对齐为 /api/user/login/...（如 sendEmailCode、checkMobile、checkEmail、forgetPassword 等）
  - user/collectProduct 兼容路径已补充：/api/user/collectProduct/*（list/save/cancel）
  - user/user 下的部分接口当前为 /api/user/...（少一层 user），例如 updateInformation、memberCenter、historyProduct、delHistoryProduct、logout、close、userOpenId 等；需决定是否增加别名以完全对齐 PHP 路径 /api/user/user/...

-- 尚未发现或缺失的模块（建议后续接通）：
  - home（/api/home/home/* 已实现；/api/home/share/import 待定）
  - sys/region（/api/sys/region/* 已实现）
  - product/exchange（/api/product/exchange/*）
  - user 子模块：aftersales、comment、coupon、feedback、invoice、message、orderInvoice、pointsLog、rechargeOrder、withdrawApply、sign、company、oauth
  - common：pc（getHeader/getNav/getCatFloor）、util（qrCode/miniCode）、currency（getCurrency）
  - article：/api/article/article/*、/api/article/category/*
  - order：/api/order/check/*、/api/order/pay/* 已对齐（updateCoupon 仍待验证）

提示：为兼容历史前端，建议优先补齐 user/login 路由别名、user/user 路由别名，以及 /api/home 与 /api/sys/region 基础接口；其余模块按业务优先级逐步对齐。
