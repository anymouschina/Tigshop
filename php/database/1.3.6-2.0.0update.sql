#V1.3.6 - V2.0.0
#添加电子卡券组 菜单
INSERT INTO `authority` (`authority_id`, `authority_sn`, `authority_name`, `parent_id`, `sort_order`, `is_show`, `child_auth`, `route_link`, `authority_ico`, `is_system`, `admin_type`) VALUES (10000387, 'eCardManage', '电子卡券组', 10005, 50, 1, '[]', 'promotion/e_card/list/', '', 0, 'shop');

INSERT INTO `authority` (`authority_id`, `authority_sn`, `authority_name`, `parent_id`, `sort_order`, `is_show`, `child_auth`, `route_link`, `authority_ico`, `is_system`, `admin_type`) VALUES (10000386, 'eCardManage', '电子卡券组', 5, 50, 1, '[]', 'promotion/e_card/list/', '', 0, 'admin');

#删除app消息推送菜单
DELETE FROM `authority` WHERE `authority_id` = 75;

#文章分类修改注释
ALTER TABLE `article_category` MODIFY COLUMN `parent_id` smallint(5) UNSIGNED NOT NULL DEFAULT 0 COMMENT '父节点id，取值于该表article_category_id字段' AFTER `sort_order`;

#购车车表修改注释
ALTER TABLE `cart` MODIFY COLUMN `type` smallint(3) UNSIGNED NOT NULL DEFAULT 1 COMMENT '类型：1：普通购物车商品，2：拼团,3积分兑换4赠品，5砍一砍 6 虚拟 7 付费商品 8 卡密商品' AFTER `shop_id`;

#订单表修改注释
ALTER TABLE `order` MODIFY COLUMN `is_settlement` tinyint(2) NULL DEFAULT 0 COMMENT '是否结算0未结算1已结算' AFTER `out_trade_no`;
ALTER TABLE `order` MODIFY COLUMN `order_type` tinyint(2) NULL DEFAULT 1 COMMENT '订单类型：1普通订单，3积分订单，2拼团，5砍一砍 6 虚拟订单 7 付费商品订单 8 卡密订单' AFTER `is_exchange_order`;

#商品表增加字段并修改注释
ALTER TABLE .`product` MODIFY COLUMN `product_type` tinyint(1) NULL DEFAULT 1 COMMENT '商品类型 1普通商品 2虚拟商品3 卡密商品 4 付费内容' AFTER `product_status`;
ALTER TABLE `product` ADD COLUMN `card_group_id` int(13) NOT NULL DEFAULT 0 COMMENT '关联的电子卡券分组' AFTER `prepay_price`;
ALTER TABLE `product` ADD COLUMN `virtual_sample` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '虚拟商品' AFTER `card_group_id`;
ALTER TABLE `product` ADD COLUMN `paid_content` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '付费内容' AFTER `virtual_sample`;

#发票资质修改字段
ALTER TABLE `user_invoice` DROP COLUMN `mobiel`;
ALTER TABLE `user_invoice` ADD COLUMN `mobile` varchar(80) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '手机号' AFTER `company_account`;

#电子卡券表
CREATE TABLE `e_card`  (
       `card_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '卡券分组id',
       `group_id` int(10) UNSIGNED NOT NULL COMMENT '卡券分组id',
       `card_number` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '卡号',
       `card_pwd` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '卡号密码',
       `is_use` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0:未使用,1:已使用',
       `order_id` int(13) NOT NULL DEFAULT 0 COMMENT '订单id',
       `order_item_id` int(11) NOT NULL DEFAULT 0 COMMENT '订单item_id',
       `add_time` int(11) UNSIGNED NULL DEFAULT 0 COMMENT '添加时间',
       `up_time` int(11) UNSIGNED NULL DEFAULT 0 COMMENT '更新时间',
       PRIMARY KEY (`card_id`) USING BTREE,
       INDEX `group_id`(`group_id`) USING BTREE,
       INDEX `order_id`(`order_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '电子卡券表' ROW_FORMAT = COMPACT;

#电子卡券组
CREATE TABLE `e_card_group`  (
     `group_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '卡券分组id',
     `group_name` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '分组名称',
     `shop_id` int(11) UNSIGNED NOT NULL COMMENT '店铺id',
     `remark` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT '备注',
     `is_use` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0:不使用,1:使用',
     `add_time` int(11) UNSIGNED NULL DEFAULT 0 COMMENT '添加时间',
     `up_time` int(11) UNSIGNED NULL DEFAULT 0 COMMENT '更新时间',
     PRIMARY KEY (`group_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci COMMENT = '电子卡券分组表' ROW_FORMAT = COMPACT;

#店铺订单配置表
CREATE TABLE `order_config`  (
     `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
     `shop_id` int(11) UNSIGNED NOT NULL DEFAULT 0 COMMENT '店铺id',
     `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '编码',
     `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '[json]配置数据',
     PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '店铺订单配置表' ROW_FORMAT = Dynamic;

