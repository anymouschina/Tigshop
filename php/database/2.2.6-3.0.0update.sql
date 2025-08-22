RENAME
TABLE config TO `config_2.2.6`;
CREATE TABLE `config`
(
    `id`             bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
    `biz_code`       varchar(64)  NOT NULL COMMENT '业务编码',
    `biz_val` text NULL COMMENT '业务值',
    `create_time`    bigint(20) DEFAULT 0 COMMENT '创建时间',
    `create_by_id`   bigint(20) DEFAULT 0 COMMENT '创建人主键',
    `create_by_name` varchar(255) DEFAULT '' COMMENT '创建人名称',
    `update_time`    bigint(20) DEFAULT 0 COMMENT '更新时间',
    `update_by_id`   bigint(20) DEFAULT 0 COMMENT '编辑人主键',
    `update_by_name` varchar(255) DEFAULT '' COMMENT '更新人名称',
    `is_del`         tinyint(4) DEFAULT 0 COMMENT '是否删除；0-否，1-是',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

CREATE TABLE `product_video`
(
    `video_id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '商品视频ID',
    `product_id` MEDIUMINT(8) UNSIGNED NOT NULL DEFAULT '0' COMMENT '商品id',
    `video_url` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '视频url',
    PRIMARY KEY (`video_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COMMENT = '产品视频关联表';

CREATE TABLE `gallery_video_info` (
                                      `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
                                      `shop_id` mediumint(8) unsigned NOT NULL DEFAULT '0' COMMENT '商户id',
                                      `gallery_id` mediumint(8) unsigned NOT NULL DEFAULT '0' COMMENT '相册id',
                                      `video_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '视频地址',
                                      `video_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '视频名称',
                                      `add_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '添加时间',
                                      `add_user_id` mediumint(8) unsigned NOT NULL DEFAULT '0' COMMENT '创建人id',
                                      PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='视频相册';

CREATE TABLE `gallery_video` (
                                 `id` mediumint(8) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
                                 `shop_id` mediumint(8) unsigned NOT NULL DEFAULT '0' COMMENT '商户id',
                                 `parent_id` mediumint(8) unsigned NOT NULL DEFAULT '0' COMMENT '父级id',
                                 `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '名称',
                                 `sort` mediumint(8) unsigned NOT NULL DEFAULT '50' COMMENT '排序',
                                 `add_time` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '添加时间',
                                 `add_user_id` mediumint(8) unsigned NOT NULL DEFAULT '1' COMMENT '创建人id',
                                 PRIMARY KEY (`id`),
                                 KEY `idx_shop_parent` (`shop_id`, `parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='视频相册文件夹';

ALTER TABLE `product`
    ADD COLUMN `no_shipping` tinyint(2) NULL DEFAULT 0 COMMENT '是否无需配送0不是1是';