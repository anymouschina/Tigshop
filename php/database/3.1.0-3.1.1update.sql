UPDATE `config` SET biz_val='/static/mini/images/common/default_tech_support.png' where biz_code='defaultTechSupport';

UPDATE `authority` SET `authority_sn` = 'configManage', `authority_name` = '商城设置', `parent_id` = 15, `sort_order` = 50, `is_show` = 1, `child_auth` = '[{\"auth_name\":\"\\u4fdd\\u5b58\\u5546\\u57ce\\u57fa\\u7840\\u8bbe\\u7f6e\",\"auth_sn\":\"saveBasicManage\"},{\"auth_name\":\"\\u57fa\\u7840\\u8bbe\\u7f6e\\u66f4\\u65b0\",\"auth_sn\":\"settingSaveManage\"},{\"auth_name\":\"\\u8bbe\\u7f6e\\u7f16\\u8f91\",\"auth_sn\":\"settingUpdateManage\"},{\"auth_name\":\"\\u53d1\\u9001\\u6d4b\\u8bd5\\u90ae\\u4ef6\",\"auth_sn\":\"sendTestEmailModifyManage\"},{\"auth_name\":\"\\u751f\\u6210\\u5e73\\u53f0\\u8bc1\\u4e66\",\"auth_sn\":\"platformCertificateModifyManage\"},{\"auth_name\":\"\\u76f8\\u518c\\u4fee\\u6539\",\"auth_sn\":\"galleryModifyManage\"},{\"auth_name\":\"\\u76f8\\u518c\\u56fe\\u7247\\u4fee\\u6539\",\"auth_sn\":\"galleryPicModifyManage\"},{\"auth_name\":\"\\u76f8\\u518c\\u7ba1\\u7406\",\"auth_sn\":\"galleryManage\"},{\"auth_name\":\"\\u76f8\\u518c\\u56fe\\u7247\\u7ba1\\u7406\",\"auth_sn\":\"galleryPicManage\"},{\"auth_name\":\"\\u89c6\\u9891\\u7ba1\\u7406\",\"auth_sn\":\"galleryVideoManage\"}]', `route_link` = 'setting/config/base/', `authority_ico` = 'iconfont-tig icon-shangchengshezhi', `is_system` = 0, `admin_type` = 'admin' WHERE `authority_id` = 39;

UPDATE `authority` SET `authority_sn` = 'shipping', `authority_name` = '配送设置组', `parent_id` = 15, `sort_order` = 51, `is_show` = 1, `child_auth` = '[]', `route_link` = 'setting/shipping/', `authority_ico` = 'iconfont-tig icon-peisongshezhi', `is_system` = 0, `admin_type` = 'admin' WHERE `authority_id` = 55;

UPDATE `authority` SET `authority_sn` = 'themeStyleManage', `authority_name` = '主题风格', `parent_id` = 9, `sort_order` = 49, `is_show` = 1, `child_auth` = '[{\"auth_name\":\"\\u7f16\\u8f91\",\"auth_sn\":\"themeCategoryDecorateManage\"}]', `route_link` = 'decorate/theme_style/info/', `authority_ico` = 'iconfont-tig icon-zhutifengge', `is_system` = 0, `admin_type` = 'admin' WHERE `authority_id` = 246;

UPDATE `authority` SET `authority_sn` = 'AfterSalesServiceManage', `authority_name` = '售后服务设置', `parent_id` = 38, `sort_order` = 55, `is_show` = 0, `child_auth` = '[{\"auth_name\":\"\\u7f16\\u8f91\",\"auth_sn\":\"settingSaveAfterSalesManage\"}]', `route_link` = 'setting/config/after_sales_service/', `authority_ico` = '', `is_system` = 0, `admin_type` = 'admin' WHERE `authority_id` = 267;

UPDATE `authority` SET `authority_sn` = 'logisticsManage', `authority_name` = '配送设置', `parent_id` = 55, `sort_order` = 50, `is_show` = 1, `child_auth` = '[{\"auth_name\":\"\\u7f16\\u8f91\",\"auth_sn\":\"settingSaveShippingManage\"}]', `route_link` = 'setting/config/logistics/', `authority_ico` = '', `is_system` = 0, `admin_type` = 'admin' WHERE `authority_id` = 10000384;

UPDATE `authority` SET `authority_sn` = 'baseBasicManage', `authority_name` = '基础信息', `parent_id` = 39, `sort_order` = 50, `is_show` = 1, `child_auth` = '[{\"auth_name\":\"\\u7f16\\u8f91\",\"auth_sn\":\"saveBasicManage\"}]', `route_link` = '', `authority_ico` = '', `is_system` = 0, `admin_type` = 'admin' WHERE `authority_id` = 10000397;

UPDATE `authority` SET `authority_sn` = 'baseProductManage', `authority_name` = '商品设置', `parent_id` = 39, `sort_order` = 50, `is_show` = 1, `child_auth` = '[{\"auth_name\":\"\\u7f16\\u8f91\",\"auth_sn\":\"saveSettingProductManage\"}]', `route_link` = '', `authority_ico` = '', `is_system` = 0, `admin_type` = 'admin' WHERE `authority_id` = 10000398;

UPDATE `authority` SET `authority_sn` = 'baseShoppingManage', `authority_name` = '交易设置', `parent_id` = 39, `sort_order` = 50, `is_show` = 1, `child_auth` = '[{\"auth_name\":\"\\u7f16\\u8f91\",\"auth_sn\":\"saveSettingShoppingManage\"}]', `route_link` = '', `authority_ico` = '', `is_system` = 0, `admin_type` = 'admin' WHERE `authority_id` = 10000399;

UPDATE `authority` SET `authority_sn` = 'baseOrderManage', `authority_name` = '订单设置', `parent_id` = 39, `sort_order` = 50, `is_show` = 1, `child_auth` = '[{\"auth_name\":\"\\u7f16\\u8f91\",\"auth_sn\":\"saveSettingsOrderManage\"}]', `route_link` = '', `authority_ico` = '', `is_system` = 0, `admin_type` = 'admin' WHERE `authority_id` = 10000400;

UPDATE `authority` SET `authority_sn` = 'baseNoticeManage', `authority_name` = '通知设置', `parent_id` = 10000405, `sort_order` = 50, `is_show` = 1, `child_auth` = '[{\"auth_name\":\"\\u7f16\\u8f91\",\"auth_sn\":\"saveSettingNotifyManage\"}]', `route_link` = '', `authority_ico` = '', `is_system` = 0, `admin_type` = 'admin' WHERE `authority_id` = 10000401;

UPDATE `authority` SET `authority_sn` = 'baseServiceManage', `authority_name` = '客服设置', `parent_id` = 39, `sort_order` = 50, `is_show` = 1, `child_auth` = '[{\"auth_name\":\"\\u7f16\\u8f91\",\"auth_sn\":\"saveSettingKefuManage\"}]', `route_link` = '', `authority_ico` = '', `is_system` = 0, `admin_type` = 'admin' WHERE `authority_id` = 10000402;

UPDATE `authority` SET `authority_sn` = 'globalSetting', `authority_name` = '全局设置', `parent_id` = 38, `sort_order` = 50, `is_show` = 1, `child_auth` = '[{\"auth_name\":\"\\u7f16\\u8f91\",\"auth_sn\":\"saveSettingsGlobalManage\"}]', `route_link` = '', `authority_ico` = '', `is_system` = 0, `admin_type` = 'admin' WHERE `authority_id` = 10000403;

UPDATE `authority` SET `authority_sn` = 'loginSetting', `authority_name` = '登录设置', `parent_id` = 38, `sort_order` = 51, `is_show` = 1, `child_auth` = '[{\"auth_name\":\"\\u7f16\\u8f91\",\"auth_sn\":\"saveSettingsSaveLoginManage\"}]', `route_link` = '', `authority_ico` = '', `is_system` = 0, `admin_type` = 'admin' WHERE `authority_id` = 10000420;

UPDATE `authority` SET `authority_sn` = 'paymentSetting', `authority_name` = '支付设置', `parent_id` = 38, `sort_order` = 52, `is_show` = 1, `child_auth` = '[{\"auth_name\":\"\\u7f16\\u8f91\",\"auth_sn\":\"uploadFileModifyManage\"}]', `route_link` = '', `authority_ico` = '', `is_system` = 0, `admin_type` = 'admin' WHERE `authority_id` = 10000439;

UPDATE `authority` SET `authority_sn` = 'userAuthenticationManage', `authority_name` = '认证设置', `parent_id` = 10000423, `sort_order` = 1, `is_show` = 1, `child_auth` = '[{\"auth_name\":\"\\u7f16\\u8f91\",\"auth_sn\":\"saveAuthSettingsManage\"}]', `route_link` = '', `authority_ico` = '', `is_system` = 0, `admin_type` = 'admin' WHERE `authority_id` = 10000460;

ALTER TABLE `user`
    ADD COLUMN `status` tinyint(2) NULL DEFAULT 1 COMMENT '状态0禁用1启用';