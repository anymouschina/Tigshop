UPDATE `authority` SET `parent_id` = 39 WHERE `authority_sn` = 'AfterSalesServiceManage';
UPDATE `authority` SET `parent_id` = 10000306 WHERE `authority_sn` = 'adminMerchant';
ALTER TABLE `shop_account_log` MODIFY COLUMN `type` VARCHAR (60) CHARACTER
    SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL DEFAULT '' COMMENT '1:店铺资金，2:提现';
ALTER TABLE `shop_account_log` Add COLUMN `is_new` TINYINT (1) NOT NULL DEFAULT '0' COMMENT '新老数据兼容，0:旧版本，1:新版本';