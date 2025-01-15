#修改的表数据
ALTER TABLE `config` CHARACTER SET = utf8mb4, COLLATE = utf8mb4_general_ci;
ALTER TABLE `translations_data` MODIFY COLUMN `data_type` tinyint(2) NULL DEFAULT 0 COMMENT '据类型，0：页面，1：接口，2：商品，3：分类，4：品牌, 5: 设置，6:文章标题' AFTER `translation_value`;
ALTER TABLE `user` MODIFY COLUMN `is_distribution` tinyint(1) NULL DEFAULT 0 COMMENT '是否是分销员（已弃用）' AFTER `history_product_ids`;
ALTER TABLE `user` MODIFY COLUMN `distribution_register_time` int(11) NULL DEFAULT 0 COMMENT '分销员注册时间（已弃用）' AFTER `is_distribution`;
ALTER TABLE `user_rank` MODIFY COLUMN `min_growth_points` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT '该等级的最低成长值（升级条件）' AFTER `rank_name`;
ALTER TABLE `user_rank` MODIFY COLUMN `max_growth_points` int(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT '该等级的最高成长值（已弃用）' AFTER `min_growth_points`;
ALTER TABLE `user_rank` MODIFY COLUMN `discount` decimal(4, 1) UNSIGNED NOT NULL DEFAULT 0.0 COMMENT '该会员等级的商品折扣' AFTER `max_growth_points`;
ALTER TABLE `user_rank` MODIFY COLUMN `show_price` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '是否显示商品价格（已弃用）' AFTER `discount`;
ALTER TABLE `user_rank` MODIFY COLUMN `rank_type` tinyint(1) UNSIGNED NOT NULL DEFAULT 0 COMMENT '等级类型：1：根据成长值变化，2：根据消费行为' AFTER `show_price`;
ALTER TABLE `user_rank` ADD COLUMN `rank_logo` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '会员图标' AFTER `rank_type`;
ALTER TABLE `user_rank` ADD COLUMN `rank_point` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '0' COMMENT '权益积分' AFTER `rank_bg`;
ALTER TABLE `user_rank` ADD COLUMN `free_shipping` tinyint(1) UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否包邮：1 是 0 否' AFTER `rank_point`;
ALTER TABLE `user_rank` ADD COLUMN `rank_card_type` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '会员卡类型：1 背景色 2自定义图片' AFTER `free_shipping`;
ALTER TABLE `user_rank` ADD COLUMN `rights` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT '自定义权益【json】' AFTER `rank_card_type`;
ALTER TABLE `user_rank` ADD COLUMN `rank_level` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '会员等级' AFTER `rights`;

#创建的新表
CREATE TABLE `price_inquiry`  (
     `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
     `mobile` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '联系电话',
     `content` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '需求信息',
     `product_id` int(11) UNSIGNED NOT NULL DEFAULT 0 COMMENT '商品id',
     `remark` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '回复备注',
     `status` tinyint(1) UNSIGNED NOT NULL DEFAULT 0 COMMENT '回复状态：0 未回复 1 已回复',
     `shop_id` int(11) UNSIGNED NOT NULL DEFAULT 0 COMMENT '店铺id',
     `create_time` int(10) UNSIGNED NULL DEFAULT 0 COMMENT '创建时间',
     PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '商品询价表' ROW_FORMAT = Dynamic;

CREATE TABLE `rank_growth_log`  (
   `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
   `user_id` int(11) UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户id',
   `type` tinyint(1) UNSIGNED NOT NULL DEFAULT 0 COMMENT '成长值类型：1 完成下单',
   `growth_points` int(11) UNSIGNED NOT NULL DEFAULT 0 COMMENT '成长值',
   `change_type` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '变化类型：1 增加 2 减少',
   `create_time` int(10) UNSIGNED NULL DEFAULT 0 COMMENT '创建时间',
   PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '成长值日志表' ROW_FORMAT = Dynamic;

CREATE TABLE `user_rank_config`  (
    `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '配置编码',
    `rank_type` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '等级类型：1 成长值 2 消费行为',
    `data` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT '等级配置[json]',
    PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '会员等级配置表' ROW_FORMAT = Dynamic;

CREATE TABLE `user_rank_log`  (
     `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
     `user_id` int(11) UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户id',
     `rank_id` int(11) UNSIGNED NOT NULL DEFAULT 0 COMMENT '等级id',
     `rank_type` tinyint(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '等级类型',
     `rank_name` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '等级名称',
     `change_time` int(10) UNSIGNED NULL DEFAULT 0 COMMENT '变更时间',
     `remark` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '变更备注',
     PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '会员等级变更日志表' ROW_FORMAT = Dynamic;

#需要插入的数据信息
INSERT INTO `authority` (`authority_id`, `authority_sn`, `authority_name`, `parent_id`, `sort_order`, `is_show`, `child_auth`, `route_link`, `authority_ico`, `is_system`, `admin_type`) VALUES (10000392, 'enquiryManage', '商品询价', 2, 50, 1, '[]', 'product/enquiry/list/', '', 0, 'admin');
