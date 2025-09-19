-- CreateTable
CREATE TABLE `product_attributes` (
    `attributes_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `product_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `attr_type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `attr_name` VARCHAR(80) NOT NULL DEFAULT '',
    `attr_value` VARCHAR(120) NOT NULL DEFAULT '',
    `attr_price` DECIMAL(8, 2) NULL DEFAULT 0.00,
    `attr_color` VARCHAR(80) NULL DEFAULT '',
    `attr_pic` VARCHAR(255) NULL DEFAULT '',
    `attr_pic_thumb` VARCHAR(255) NULL DEFAULT '',

    INDEX `attr_name`(`attr_name`),
    INDEX `attr_type`(`attr_type`),
    INDEX `attr_value`(`attr_value`),
    INDEX `goods_id`(`product_id`),
    PRIMARY KEY (`attributes_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `access_log` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `access_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `ip_address` VARCHAR(15) NOT NULL DEFAULT '',
    `product_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `shop_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `params_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `controller` VARCHAR(20) NULL DEFAULT '',
    `access_domain` VARCHAR(100) NULL DEFAULT '',
    `access_path` VARCHAR(200) NULL DEFAULT '',

    INDEX `access_time`(`access_time`),
    INDEX `goods_id`(`product_id`),
    INDEX `ip_address`(`ip_address`),
    INDEX `shop_id`(`shop_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_log` (
    `log_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `log_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `user_id` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `log_info` VARCHAR(255) NOT NULL DEFAULT '',
    `ip_address` VARCHAR(255) NOT NULL DEFAULT '',

    INDEX `log_time`(`log_time`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_msg` (
    `msg_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `msg_type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `send_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `is_readed` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `admin_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `order_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `product_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `title` VARCHAR(255) NOT NULL DEFAULT '',
    `content` TEXT NOT NULL,
    `msg_link` VARCHAR(255) NULL DEFAULT '',
    `related_data` TEXT NULL,
    `vendor_id` INTEGER NULL DEFAULT 0,

    INDEX `admin_id`(`admin_id`),
    INDEX `goods_id`(`product_id`),
    INDEX `idx_vendor_id`(`vendor_id`),
    INDEX `is_readed`(`is_readed`),
    INDEX `msg_type`(`msg_type`),
    INDEX `order_id`(`order_id`),
    INDEX `shop_id`(`shop_id`),
    PRIMARY KEY (`msg_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_role` (
    `role_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `role_name` VARCHAR(60) NOT NULL DEFAULT '',
    `role_desc` VARCHAR(255) NULL DEFAULT '',
    `authority_list` TEXT NOT NULL,
    `admin_type` VARCHAR(255) NULL DEFAULT 'admin',
    `merchant_id` INTEGER NOT NULL DEFAULT 0,
    `shop_id` INTEGER NOT NULL DEFAULT 0,
    `vendor_id` INTEGER NOT NULL DEFAULT 0,

    INDEX `user_name`(`role_name`),
    PRIMARY KEY (`role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_user` (
    `admin_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(60) NOT NULL DEFAULT '',
    `admin_type` VARCHAR(60) NOT NULL DEFAULT 'admin',
    `mobile` VARCHAR(255) NULL DEFAULT '',
    `avatar` VARCHAR(255) NULL,
    `password` VARCHAR(80) NOT NULL DEFAULT '',
    `email` VARCHAR(60) NOT NULL DEFAULT '',
    `add_time` INTEGER NOT NULL DEFAULT 0,
    `auth_list` TEXT NOT NULL,
    `user_id` INTEGER NOT NULL DEFAULT 0,
    `suppliers_id` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `role_id` SMALLINT NOT NULL,
    `merchant_id` INTEGER NOT NULL DEFAULT 0,
    `parent_id` INTEGER NOT NULL DEFAULT 0,
    `menu_tag` TEXT NULL,
    `order_export` TEXT NULL,
    `extra` TEXT NULL,
    `shop_id` INTEGER NOT NULL DEFAULT 0,
    `is_using` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `initial_password` VARCHAR(80) NOT NULL DEFAULT '',

    INDEX `user_name`(`username`),
    PRIMARY KEY (`admin_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_user_shop` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `user_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `username` VARCHAR(32) NOT NULL DEFAULT '',
    `email` VARCHAR(32) NOT NULL DEFAULT '',
    `avatar` VARCHAR(255) NULL DEFAULT '',
    `auth_list` TEXT NULL,
    `is_using` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_admin` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `add_time` INTEGER UNSIGNED NULL,
    `role_id` SMALLINT UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_user_vendor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` INTEGER NOT NULL DEFAULT 0,
    `user_id` INTEGER NOT NULL DEFAULT 0,
    `vendor_id` INTEGER NOT NULL DEFAULT 0,
    `username` VARCHAR(32) NOT NULL DEFAULT '',
    `email` VARCHAR(32) NOT NULL DEFAULT '',
    `avatar` VARCHAR(255) NULL DEFAULT '',
    `auth_list` TEXT NULL,
    `is_using` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_admin` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `add_time` INTEGER NULL,
    `role_id` SMALLINT UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aftersales` (
    `aftersale_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `aftersale_type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `pics` TEXT NOT NULL,
    `description` VARCHAR(255) NOT NULL DEFAULT '',
    `reply` VARCHAR(255) NOT NULL DEFAULT '',
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `tracking_no` VARCHAR(80) NOT NULL DEFAULT '',
    `logistics_name` VARCHAR(80) NOT NULL DEFAULT '',
    `return_address` TEXT NULL,
    `aftersale_reason` VARCHAR(255) NULL,
    `aftersales_sn` VARCHAR(255) NULL,
    `order_id` INTEGER NULL,
    `user_id` INTEGER NULL,
    `refund_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `shop_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `audit_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `deal_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `final_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `return_goods_tip` VARCHAR(255) NOT NULL DEFAULT '',
    `vendor_id` INTEGER NULL,

    UNIQUE INDEX `return_id`(`aftersale_id`),
    INDEX `idx_vendor_id`(`vendor_id`),
    INDEX `order_id`(`order_id`),
    INDEX `shop_id`(`shop_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`aftersale_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aftersales_item` (
    `aftersales_item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_item_id` INTEGER NULL DEFAULT 0,
    `number` INTEGER NULL DEFAULT 0,
    `aftersale_id` INTEGER NULL DEFAULT 0,

    INDEX `aftersale_id`(`aftersale_id`),
    PRIMARY KEY (`aftersales_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `aftersales_log` (
    `log_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `aftersale_id` INTEGER UNSIGNED NOT NULL,
    `log_info` VARCHAR(255) NOT NULL DEFAULT '',
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `admin_name` VARCHAR(80) NOT NULL DEFAULT '',
    `refund_money` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    `refund_type` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `refund_desc` VARCHAR(255) NOT NULL DEFAULT '',
    `user_name` VARCHAR(80) NULL DEFAULT '',
    `return_pic` TEXT NULL,

    INDEX `aftersale_id`(`aftersale_id`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `album` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `pic_url` VARCHAR(255) NOT NULL DEFAULT '',
    `pic_name` VARCHAR(255) NOT NULL DEFAULT '',
    `pic_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `add_time` INTEGER UNSIGNED NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `app_version` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ios_version` VARCHAR(40) NULL DEFAULT '',
    `android_version` VARCHAR(40) NULL DEFAULT '',
    `ios_link` VARCHAR(120) NULL DEFAULT '',
    `android_link` VARCHAR(120) NULL DEFAULT '',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `area_code` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(32) NOT NULL DEFAULT '',
    `name` VARCHAR(50) NOT NULL DEFAULT '',
    `is_available` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `is_default` TINYINT UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `article` (
    `article_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `article_title` VARCHAR(150) NOT NULL DEFAULT '',
    `article_category_id` SMALLINT NOT NULL DEFAULT 0,
    `article_sn` VARCHAR(80) NOT NULL DEFAULT '',
    `article_thumb` VARCHAR(255) NOT NULL DEFAULT '',
    `article_tag` VARCHAR(30) NOT NULL DEFAULT '',
    `article_author` VARCHAR(30) NOT NULL DEFAULT '',
    `article_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `content` LONGTEXT NOT NULL,
    `description` VARCHAR(255) NULL DEFAULT '',
    `keywords` VARCHAR(255) NOT NULL DEFAULT '',
    `is_show` TINYINT UNSIGNED NULL DEFAULT 1,
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `is_hot` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_top` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `click_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `link` VARCHAR(255) NOT NULL DEFAULT '',

    INDEX `cat_id`(`article_category_id`),
    INDEX `is_hot`(`is_hot`),
    INDEX `is_show`(`is_show`),
    INDEX `is_top`(`is_top`),
    PRIMARY KEY (`article_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `article_category` (
    `article_category_id` SMALLINT NOT NULL AUTO_INCREMENT,
    `article_category_name` VARCHAR(255) NOT NULL DEFAULT '',
    `category_sn` VARCHAR(80) NOT NULL DEFAULT '',
    `category_type` MEDIUMINT UNSIGNED NOT NULL DEFAULT 1,
    `keywords` VARCHAR(255) NOT NULL DEFAULT '',
    `description` VARCHAR(255) NOT NULL DEFAULT '',
    `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 50,
    `parent_id` SMALLINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `cat_type`(`category_type`),
    INDEX `parent_id`(`parent_id`),
    INDEX `sort_order`(`sort_order`),
    PRIMARY KEY (`article_category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `authority` (
    `authority_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `authority_sn` VARCHAR(50) NOT NULL DEFAULT '',
    `authority_name` VARCHAR(90) NOT NULL DEFAULT '',
    `parent_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 50,
    `is_show` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `child_auth` TEXT NULL,
    `route_link` VARCHAR(255) NOT NULL DEFAULT '',
    `authority_ico` VARCHAR(80) NOT NULL DEFAULT '',
    `is_system` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `admin_type` VARCHAR(10) NOT NULL DEFAULT 'admin',

    INDEX `authority_sn`(`authority_sn`),
    INDEX `is_show`(`is_show`),
    INDEX `parent_id`(`parent_id`),
    INDEX `sort_order`(`sort_order`),
    PRIMARY KEY (`authority_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bargain` (
    `bargain_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `bargain_name` VARCHAR(255) NOT NULL,
    `bargain_pic` VARCHAR(255) NOT NULL,
    `start_time` INTEGER UNSIGNED NOT NULL,
    `end_time` INTEGER UNSIGNED NOT NULL,
    `cut_price_limit` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `cut_num_limit` INTEGER NOT NULL DEFAULT 0,
    `first_cut_range` VARCHAR(255) NOT NULL,
    `cut_range` VARCHAR(255) NOT NULL,
    `product_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `sku_id` MEDIUMINT NOT NULL DEFAULT 0,
    `is_show` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 50,
    `success_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `shop_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `is_show`(`is_show`),
    PRIMARY KEY (`bargain_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bargain_group` (
    `group_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `bargain_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `bargain_name` VARCHAR(255) NOT NULL,
    `product_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `sku_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `price` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    `order_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`group_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bargain_log` (
    `log_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `bargain_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `product_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `sku_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `cut_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `add_time` INTEGER UNSIGNED NOT NULL,
    `group_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brand` (
    `brand_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `brand_name` VARCHAR(60) NOT NULL DEFAULT '',
    `brand_logo` VARCHAR(120) NULL DEFAULT '',
    `brand_desc` TEXT NULL,
    `site_url` VARCHAR(255) NOT NULL DEFAULT '',
    `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 50,
    `is_show` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `brand_type` VARCHAR(80) NULL DEFAULT '',
    `brand_is_hot` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `first_word` VARCHAR(11) NULL DEFAULT '',
    `is_store_brand` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `check_status` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `brand_en_name` VARCHAR(80) NULL DEFAULT '',
    `shop_id` INTEGER NOT NULL DEFAULT 0,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `reject_remark` TEXT NULL,

    INDEX `first_word`(`first_word`),
    INDEX `is_show`(`is_show`),
    PRIMARY KEY (`brand_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cart` (
    `cart_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `product_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `product_sn` VARCHAR(60) NOT NULL DEFAULT '',
    `pic_thumb` VARCHAR(255) NULL DEFAULT '',
    `market_price` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `original_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `quantity` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `sku_id` MEDIUMINT UNSIGNED NULL DEFAULT 0,
    `sku_data` TEXT NULL,
    `product_type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_checked` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `type` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    `update_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `salesman_id` INTEGER NOT NULL DEFAULT 0,
    `extra_sku_data` TEXT NULL,

    INDEX `is_checked`(`is_checked`),
    INDEX `product_id`(`product_id`),
    INDEX `sku_id`(`sku_id`),
    INDEX `store_id`(`shop_id`),
    INDEX `type`(`type`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`cart_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category` (
    `category_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(90) NOT NULL DEFAULT '',
    `keywords` VARCHAR(255) NOT NULL DEFAULT '',
    `category_desc` VARCHAR(255) NOT NULL DEFAULT '',
    `parent_id` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 50,
    `measure_unit` VARCHAR(15) NOT NULL DEFAULT '',
    `is_show` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `seo_title` VARCHAR(255) NOT NULL DEFAULT '',
    `short_name` VARCHAR(80) NOT NULL DEFAULT '',
    `category_pic` VARCHAR(255) NOT NULL DEFAULT '',
    `category_ico` VARCHAR(80) NOT NULL DEFAULT '',
    `is_hot` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `search_keywords` VARCHAR(255) NOT NULL DEFAULT '',

    INDEX `is_hot`(`is_hot`),
    INDEX `is_show`(`is_show`),
    INDEX `parent_id`(`parent_id`),
    INDEX `sort_order`(`sort_order`),
    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `collect_product` (
    `collect_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `product_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    INDEX `product_id`(`product_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`collect_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `collect_shop` (
    `collect_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `shop_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    INDEX `shop_id`(`shop_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`collect_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comment` (
    `comment_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `username` VARCHAR(60) NOT NULL DEFAULT '',
    `avatar` VARCHAR(255) NOT NULL DEFAULT '',
    `product_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `order_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `order_item_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `comment_rank` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `content` TEXT NOT NULL,
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `parent_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `usefull` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `useless` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `comment_tag` MEDIUMTEXT NULL,
    `show_pics` MEDIUMTEXT NULL,
    `is_recommend` TINYINT UNSIGNED NULL DEFAULT 0,
    `is_top` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_showed` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_default` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `sort_order` MEDIUMINT UNSIGNED NOT NULL DEFAULT 50,
    `shop_id` MEDIUMINT NOT NULL DEFAULT 0,

    INDEX `is_default`(`is_default`),
    INDEX `is_showed`(`is_showed`),
    INDEX `order_item_id`(`order_item_id`),
    INDEX `parent_id`(`parent_id`),
    INDEX `product_id`(`product_id`),
    INDEX `sort_order`(`sort_order`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`comment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `config` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `biz_code` VARCHAR(64) NOT NULL,
    `biz_val` TEXT NULL,
    `create_time` BIGINT NULL DEFAULT 0,
    `create_by_id` BIGINT NULL DEFAULT 0,
    `create_by_name` VARCHAR(255) NULL DEFAULT '',
    `update_time` BIGINT NULL DEFAULT 0,
    `update_by_id` BIGINT NULL DEFAULT 0,
    `update_by_name` VARCHAR(255) NULL DEFAULT '',
    `is_del` TINYINT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `config_2.2.6` (
    `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(80) NOT NULL,
    `data` LONGTEXT NOT NULL,

    INDEX `code`(`code`),
    INDEX `id`(`id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupon` (
    `coupon_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `coupon_name` VARCHAR(60) NOT NULL DEFAULT '',
    `coupon_money` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `coupon_discount` DECIMAL(4, 1) NOT NULL DEFAULT 10.0,
    `coupon_desc` VARCHAR(255) NOT NULL DEFAULT '',
    `coupon_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `send_range` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `send_range_data` TEXT NOT NULL,
    `min_order_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `send_start_date` INTEGER NOT NULL DEFAULT 0,
    `send_end_date` INTEGER NOT NULL DEFAULT 0,
    `send_type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `use_day` SMALLINT NOT NULL DEFAULT 30,
    `use_start_date` INTEGER NOT NULL DEFAULT 0,
    `use_end_date` INTEGER NOT NULL DEFAULT 0,
    `is_show` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_global` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_new_user` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `enabled_click_get` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `limit_user_rank` TEXT NULL,
    `shop_id` MEDIUMINT UNSIGNED NULL DEFAULT 0,
    `is_delete` BOOLEAN NULL DEFAULT false,
    `limit_num` INTEGER NULL DEFAULT 0,
    `delay_day` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `send_num` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `max_order_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `coupon_unit` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `reduce_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `add_time` INTEGER NULL DEFAULT 0,

    INDEX `add_time`(`add_time`),
    INDEX `is_show`(`is_show`),
    INDEX `send_end_date`(`send_end_date`),
    INDEX `send_start_date`(`send_start_date`),
    INDEX `use_end_date`(`use_end_date`),
    INDEX `use_start_date`(`use_start_date`),
    PRIMARY KEY (`coupon_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crons` (
    `cron_id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `cron_sn` VARCHAR(20) NOT NULL DEFAULT '',
    `cron_name` VARCHAR(120) NOT NULL DEFAULT '',
    `cron_desc` TEXT NULL,
    `last_runtime` INTEGER NOT NULL DEFAULT 0,
    `next_runtime` INTEGER NOT NULL DEFAULT 0,
    `cron_type` TINYINT NOT NULL DEFAULT 0,
    `cron_config` TEXT NOT NULL,
    `is_enabled` BOOLEAN NOT NULL DEFAULT true,
    `just_once` BOOLEAN NOT NULL DEFAULT false,
    `white_ip_list` VARCHAR(100) NOT NULL DEFAULT '',

    INDEX `cron_code`(`cron_sn`),
    INDEX `enable`(`is_enabled`),
    INDEX `nextime`(`next_runtime`),
    PRIMARY KEY (`cron_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `currency` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(32) NOT NULL DEFAULT '',
    `symbol` VARCHAR(32) NOT NULL DEFAULT '',
    `is_default` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `rate` VARCHAR(32) NOT NULL DEFAULT '',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `decorate` (
    `decorate_id` INTEGER NOT NULL AUTO_INCREMENT,
    `decorate_title` VARCHAR(120) NULL DEFAULT '',
    `data` LONGTEXT NULL,
    `draft_data` LONGTEXT NULL,
    `decorate_type` TINYINT NULL DEFAULT 1,
    `is_home` INTEGER NULL DEFAULT 0,
    `shop_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `status` BOOLEAN NULL DEFAULT false,
    `update_time` INTEGER NULL DEFAULT 0,
    `locale_id` INTEGER NULL DEFAULT 0,
    `parent_id` INTEGER NULL DEFAULT 0,

    INDEX `page_id`(`is_home`),
    INDEX `page_type`(`decorate_type`),
    INDEX `status`(`status`),
    INDEX `store_id`(`shop_id`),
    PRIMARY KEY (`decorate_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `decorate_discrete` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `decorate_sn` VARCHAR(80) NOT NULL DEFAULT '',
    `decorate_name` VARCHAR(255) NULL DEFAULT '',
    `data` TEXT NOT NULL,
    `shop_id` INTEGER NOT NULL DEFAULT 0,

    INDEX `shop_id`(`shop_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `decorate_share` (
    `share_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `share_sn` CHAR(6) NOT NULL DEFAULT '',
    `share_token` CHAR(5) NOT NULL DEFAULT '0',
    `decorate_id` INTEGER NOT NULL DEFAULT 0,
    `valid_time` INTEGER NOT NULL DEFAULT 0,
    `create_time` INTEGER NOT NULL DEFAULT 0,
    `update_time` INTEGER NOT NULL DEFAULT 0,

    INDEX `decorate_id`(`decorate_id`),
    INDEX `share_sn`(`share_sn`),
    INDEX `share_token`(`share_token`),
    PRIMARY KEY (`share_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `distribution_log` (
    `log_id` MEDIUMINT NOT NULL AUTO_INCREMENT,
    `order_id` MEDIUMINT NOT NULL DEFAULT 0,
    `add_time` INTEGER NOT NULL DEFAULT 0,
    `level` TINYINT NOT NULL DEFAULT 0,
    `user_id` MEDIUMINT NOT NULL DEFAULT 0,
    `money` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `point` INTEGER NOT NULL DEFAULT 0,
    `type` BOOLEAN NOT NULL DEFAULT false,
    `log_desc` TEXT NOT NULL,
    `is_returned` TINYINT UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `e_card` (
    `card_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `group_id` INTEGER UNSIGNED NOT NULL,
    `card_number` VARCHAR(255) NOT NULL DEFAULT '',
    `card_pwd` VARCHAR(255) NOT NULL DEFAULT '',
    `is_use` BOOLEAN NOT NULL DEFAULT false,
    `order_id` INTEGER NOT NULL DEFAULT 0,
    `order_item_id` INTEGER NOT NULL DEFAULT 0,
    `add_time` INTEGER UNSIGNED NULL DEFAULT 0,
    `up_time` INTEGER UNSIGNED NULL DEFAULT 0,

    INDEX `group_id`(`group_id`),
    INDEX `order_id`(`order_id`),
    PRIMARY KEY (`card_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `e_card_group` (
    `group_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `group_name` VARCHAR(255) NOT NULL DEFAULT '',
    `shop_id` INTEGER UNSIGNED NOT NULL,
    `remark` TEXT NULL,
    `is_use` BOOLEAN NOT NULL DEFAULT false,
    `add_time` INTEGER UNSIGNED NULL DEFAULT 0,
    `up_time` INTEGER UNSIGNED NULL DEFAULT 0,

    PRIMARY KEY (`group_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `example` (
    `example_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `example_name` VARCHAR(60) NOT NULL DEFAULT '',
    `example_pic` VARCHAR(80) NOT NULL DEFAULT '',
    `example_desc` TEXT NOT NULL,
    `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 50,
    `is_show` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `status` TINYINT NULL DEFAULT 0,

    INDEX `is_show`(`is_show`),
    PRIMARY KEY (`example_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `feedback` (
    `id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `parent_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `username` VARCHAR(60) NOT NULL DEFAULT '',
    `email` VARCHAR(60) NULL DEFAULT '',
    `mobile` VARCHAR(20) NULL DEFAULT '',
    `title` VARCHAR(200) NOT NULL DEFAULT '',
    `type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `content` TEXT NOT NULL,
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `feedback_pics` TEXT NULL,
    `product_id` INTEGER UNSIGNED NULL DEFAULT 0,
    `order_id` INTEGER UNSIGNED NULL DEFAULT 0,
    `complaint_info` TEXT NULL,
    `shop_id` MEDIUMINT UNSIGNED NULL DEFAULT 0,

    INDEX `parent_id`(`parent_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `friend_links` (
    `link_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `link_title` VARCHAR(255) NOT NULL DEFAULT '',
    `link_logo` VARCHAR(255) NOT NULL DEFAULT '',
    `link_url` VARCHAR(255) NOT NULL DEFAULT '',
    `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 50,

    INDEX `show_order`(`sort_order`),
    PRIMARY KEY (`link_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gallery` (
    `gallery_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `parent_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `gallery_admin_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `gallery_name` VARCHAR(255) NOT NULL DEFAULT '',
    `gallery_sort` MEDIUMINT UNSIGNED NOT NULL DEFAULT 50,
    `gallery_thumb` VARCHAR(255) NOT NULL DEFAULT '',
    `shop_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `vendor_id` INTEGER NULL DEFAULT 0,

    INDEX `parent_id`(`parent_id`),
    INDEX `store_id`(`shop_id`),
    PRIMARY KEY (`gallery_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gallery_pic` (
    `pic_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `shop_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `gallery_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `pic_ower_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `pic_url` VARCHAR(255) NOT NULL DEFAULT '',
    `pic_name` VARCHAR(255) NOT NULL DEFAULT '',
    `pic_thumb` VARCHAR(255) NOT NULL DEFAULT '',
    `add_time` VARCHAR(255) NOT NULL DEFAULT '',
    `vendor_id` INTEGER NOT NULL DEFAULT 0,

    INDEX `gallery_id`(`gallery_id`),
    PRIMARY KEY (`pic_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gallery_video` (
    `id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `shop_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `parent_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `name` VARCHAR(255) NOT NULL DEFAULT '',
    `sort` MEDIUMINT UNSIGNED NOT NULL DEFAULT 50,
    `add_time` INTEGER NOT NULL DEFAULT 0,
    `add_user_id` MEDIUMINT NOT NULL DEFAULT 1,
    `vendor_id` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gallery_video_info` (
    `id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `shop_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `gallery_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `video_url` VARCHAR(255) NOT NULL DEFAULT '',
    `video_name` VARCHAR(255) NOT NULL DEFAULT '',
    `add_time` INTEGER NOT NULL DEFAULT 0,
    `add_user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `video_cover` VARCHAR(100) NOT NULL DEFAULT '',
    `format` VARCHAR(20) NOT NULL DEFAULT '',
    `video_first_frame` VARCHAR(255) NOT NULL DEFAULT '',
    `duration` VARCHAR(100) NOT NULL DEFAULT '',
    `size` VARCHAR(50) NOT NULL DEFAULT '',
    `vendor_id` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `groupon` (
    `groupon_id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupon_name` VARCHAR(255) NULL,
    `start_time` INTEGER NULL,
    `end_time` INTEGER NULL,
    `product_id` INTEGER NULL,
    `shop_id` INTEGER NULL,
    `add_time` INTEGER NULL,
    `team_num` INTEGER NULL,
    `limit_num` INTEGER NULL DEFAULT 0,
    `expiration_time` INTEGER NULL,

    PRIMARY KEY (`groupon_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `groupon_item` (
    `groupon_item_id` INTEGER NOT NULL AUTO_INCREMENT,
    `groupon_id` INTEGER NULL,
    `product_sku_id` INTEGER NULL,
    `price` DECIMAL(10, 2) NULL,
    `product_id` INTEGER NULL,
    `start_time` INTEGER NULL,
    `end_time` INTEGER NULL,

    PRIMARY KEY (`groupon_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `im_config` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(255) NOT NULL DEFAULT '',
    `data` TEXT NULL,
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `im_conversation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `last_servant_id` INTEGER NULL DEFAULT 0,
    `add_time` INTEGER NULL,
    `shop_id` INTEGER NULL,
    `user_from` VARCHAR(255) NULL,
    `status` TINYINT NULL DEFAULT 0,
    `last_update_time` INTEGER NULL,
    `is_delete` TINYINT NULL DEFAULT 0,
    `remark` VARCHAR(255) NOT NULL DEFAULT '',
    `summary` VARCHAR(255) NOT NULL DEFAULT '',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `im_message` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversation_id` INTEGER NULL,
    `content` TEXT NULL,
    `message_type` VARCHAR(255) NULL,
    `type` TINYINT NULL,
    `user_id` INTEGER NULL,
    `servant_id` INTEGER NULL,
    `send_time` INTEGER NULL,
    `status` TINYINT NULL DEFAULT 1,
    `extend` TEXT NULL,
    `push_status` TINYINT NULL DEFAULT 0,
    `is_read` BOOLEAN NULL DEFAULT false,
    `shop_id` INTEGER NOT NULL DEFAULT 0,
    `user_from` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `im_servant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `servant_id` INTEGER NULL,
    `last_update_time` INTEGER NULL,
    `add_time` INTEGER NULL,
    `status` TINYINT NULL DEFAULT 1,
    `shop_id` INTEGER NULL DEFAULT 0,
    `conversation_num` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `keywords` (
    `date` DATE NOT NULL,
    `searchengine` VARCHAR(20) NOT NULL DEFAULT '',
    `keyword` VARCHAR(90) NOT NULL DEFAULT '',
    `count` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `keyword`(`keyword`),
    PRIMARY KEY (`date`, `searchengine`, `keyword`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `locales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `locale_code` VARCHAR(255) NULL DEFAULT '',
    `language` VARCHAR(255) NULL DEFAULT '',
    `flag_picture` VARCHAR(255) NULL DEFAULT '',
    `last_updated` INTEGER NULL DEFAULT 0,
    `is_enabled` TINYINT NULL DEFAULT 1,
    `is_default` TINYINT UNSIGNED NULL DEFAULT 0,
    `currency_id` INTEGER UNSIGNED NULL DEFAULT 0,
    `sort` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `locales_lang` (
    `code` VARCHAR(255) NULL,
    `name` VARCHAR(255) NULL,
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name_en` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `locales_relation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `code` VARCHAR(255) NULL,
    `locales_id` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logistics_api_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NULL DEFAULT 0,
    `order_code` VARCHAR(120) NULL DEFAULT '',
    `logistic_code` VARCHAR(120) NULL DEFAULT '',
    `add_time` INTEGER NULL DEFAULT 0,
    `print_template` LONGTEXT NULL,

    INDEX `logistic_code`(`logistic_code`),
    INDEX `order_code`(`order_code`),
    INDEX `order_id`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logistics_company` (
    `logistics_id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `logistics_code` VARCHAR(20) NOT NULL DEFAULT '',
    `logistics_name` VARCHAR(120) NOT NULL DEFAULT '',
    `logistics_desc` VARCHAR(255) NOT NULL DEFAULT '',
    `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 50,
    `is_show` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `customer_name` VARCHAR(200) NULL DEFAULT '',
    `customer_pwd` VARCHAR(200) NULL DEFAULT '',
    `month_code` VARCHAR(200) NULL DEFAULT '',
    `send_site` VARCHAR(200) NULL DEFAULT '',
    `send_staff` VARCHAR(200) NULL DEFAULT '',
    `exp_type` VARCHAR(40) NULL DEFAULT '',
    `api_logistics_code` VARCHAR(20) NULL DEFAULT '',

    INDEX `is_show`(`is_show`),
    INDEX `shipping_code`(`logistics_code`),
    INDEX `shop_id`(`shop_id`),
    PRIMARY KEY (`logistics_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mail_log` (
    `mail_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `email` VARCHAR(60) NOT NULL,
    `send_time` INTEGER UNSIGNED NOT NULL,
    `status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `content` TEXT NOT NULL,

    INDEX `email`(`email`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`mail_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mail_templates` (
    `template_id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `template_code` VARCHAR(30) NOT NULL DEFAULT '',
    `is_html` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `template_subject` VARCHAR(200) NOT NULL DEFAULT '',
    `template_content` TEXT NOT NULL,
    `last_modify` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `last_send` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `type` VARCHAR(10) NOT NULL DEFAULT '',

    UNIQUE INDEX `template_code`(`template_code`),
    INDEX `type`(`type`),
    PRIMARY KEY (`template_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `merchant` (
    `merchant_id` INTEGER NOT NULL AUTO_INCREMENT,
    `merchant_apply_id` INTEGER NULL DEFAULT 0,
    `user_id` INTEGER NULL DEFAULT 0,
    `add_time` INTEGER NULL DEFAULT 0,
    `base_data` TEXT NULL,
    `shop_data` TEXT NULL,
    `merchant_data` TEXT NULL,
    `status` TINYINT NULL DEFAULT 1,
    `type` BOOLEAN NULL DEFAULT true,
    `company_name` VARCHAR(255) NULL DEFAULT '',
    `corporate_name` VARCHAR(255) NULL DEFAULT '',
    `settlement_cycle` INTEGER NULL DEFAULT 15,

    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`merchant_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `merchant_account` (
    `account_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `merchant_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `account_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `account_name` VARCHAR(60) NOT NULL DEFAULT '',
    `account_no` TEXT NOT NULL,
    `bank_name` VARCHAR(255) NOT NULL DEFAULT '',
    `add_time` INTEGER NULL DEFAULT 0,
    `bank_branch` VARCHAR(255) NULL DEFAULT '',
    `shop_id` INTEGER NULL,

    INDEX `account_type`(`account_type`),
    INDEX `merchant_id`(`merchant_id`),
    PRIMARY KEY (`account_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `merchant_apply` (
    `merchant_apply_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `add_time` INTEGER NULL DEFAULT 0,
    `shop_title` VARCHAR(255) NULL DEFAULT '',
    `status` TINYINT NULL DEFAULT 1,
    `type` TINYINT NULL DEFAULT 1,
    `contact_name` VARCHAR(255) NULL DEFAULT '',
    `contact_mobile` VARCHAR(255) NULL DEFAULT '',
    `audit_time` INTEGER NULL DEFAULT 0,
    `shop_data` TEXT NULL,
    `base_data` TEXT NULL,
    `merchant_data` TEXT NULL,
    `company_name` VARCHAR(255) NULL DEFAULT '',
    `corporate_name` VARCHAR(255) NULL DEFAULT '',
    `audit_remark` VARCHAR(255) NULL DEFAULT '',

    PRIMARY KEY (`merchant_apply_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `merchant_user` (
    `merchant_user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL DEFAULT 0,
    `admin_user_id` INTEGER NULL DEFAULT 0,
    `merchant_id` INTEGER NULL DEFAULT 0,
    `is_admin` TINYINT NULL DEFAULT 0,

    INDEX `admin_user_id`(`admin_user_id`),
    INDEX `merchant_id`(`merchant_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`merchant_user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_template` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `message_id` INTEGER NULL DEFAULT 0,
    `type` BOOLEAN NULL DEFAULT false,
    `template_name` VARCHAR(120) NULL DEFAULT '',
    `to_userid` VARCHAR(250) NULL DEFAULT '',
    `template_id` VARCHAR(120) NULL DEFAULT '',
    `template_num` VARCHAR(40) NULL DEFAULT '',
    `content` VARCHAR(800) NULL DEFAULT '',

    INDEX `message_id`(`message_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_type` (
    `message_id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NULL DEFAULT '',
    `describe` VARCHAR(120) NULL DEFAULT '',
    `send_type` BOOLEAN NULL DEFAULT true,
    `is_wechat` BOOLEAN NULL DEFAULT false,
    `is_mini_program` BOOLEAN NULL DEFAULT false,
    `is_message` BOOLEAN NULL DEFAULT false,
    `is_msg` BOOLEAN NULL DEFAULT false,
    `is_app` BOOLEAN NULL DEFAULT false,
    `is_ding` BOOLEAN NULL DEFAULT false,
    `add_time` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`message_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mobile_cat_nav` (
    `mobile_cat_nav_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `cat_color` VARCHAR(80) NOT NULL DEFAULT '',
    `child_cat_ids` TEXT NOT NULL,
    `brand_ids` VARCHAR(255) NOT NULL DEFAULT '',
    `is_show` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `img_url` TEXT NOT NULL,
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 50,
    `cat_name_alias` VARCHAR(255) NULL DEFAULT '',

    INDEX `category_id`(`category_id`),
    PRIMARY KEY (`mobile_cat_nav_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order` (
    `order_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_sn` VARCHAR(20) NOT NULL DEFAULT '',
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `parent_order_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `parent_order_sn` VARCHAR(20) NOT NULL DEFAULT '0',
    `order_status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `shipping_status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `pay_status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `consignee` VARCHAR(60) NOT NULL DEFAULT '',
    `address` TEXT NOT NULL,
    `region_ids` TINYTEXT NOT NULL,
    `region_names` TINYTEXT NOT NULL,
    `address_data` TEXT NULL,
    `mobile` VARCHAR(60) NOT NULL DEFAULT '',
    `email` VARCHAR(60) NOT NULL DEFAULT '',
    `buyer_note` VARCHAR(255) NOT NULL DEFAULT '',
    `admin_note` VARCHAR(255) NOT NULL DEFAULT '',
    `shipping_method` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `logistics_id` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `logistics_name` VARCHAR(120) NOT NULL DEFAULT '',
    `shipping_type_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `shipping_type_name` VARCHAR(120) NOT NULL DEFAULT '',
    `tracking_no` VARCHAR(255) NOT NULL DEFAULT '',
    `shipping_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `received_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `pay_type_id` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `pay_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `use_points` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `is_need_commisson` BOOLEAN NOT NULL DEFAULT false,
    `distribution_status` BOOLEAN NOT NULL DEFAULT false,
    `referrer_user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `is_del` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `shop_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `is_store_splited` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `comment_status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `paid_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `unpaid_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `unrefund_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `product_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `coupon_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `points_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `discount_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `online_paid_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `offline_paid_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `service_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `shipping_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `invoice_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `order_extension` TEXT NOT NULL,
    `order_source` VARCHAR(80) NOT NULL DEFAULT '',
    `invoice_data` TEXT NULL,
    `out_trade_no` VARCHAR(120) NULL DEFAULT '',
    `is_settlement` TINYINT NULL DEFAULT 0,
    `is_exchange_order` BOOLEAN NULL DEFAULT false,
    `order_type` TINYINT NULL DEFAULT 1,
    `mark` TINYINT NULL DEFAULT 0,
    `vendor_id` INTEGER NULL,

    UNIQUE INDEX `order_sn`(`order_sn`),
    INDEX `add_time`(`add_time`),
    INDEX `idx_vendor_id`(`vendor_id`),
    INDEX `is_del`(`is_del`),
    INDEX `is_need_commisson`(`is_need_commisson`),
    INDEX `order_status`(`order_status`),
    INDEX `pay_status`(`pay_status`),
    INDEX `pay_type_id`(`pay_type_id`),
    INDEX `referrer_user_id`(`referrer_user_id`),
    INDEX `shipping_id`(`logistics_id`),
    INDEX `shipping_status`(`shipping_status`),
    INDEX `store_id`(`shop_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`order_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_amount_detail` (
    `order_discount_detail_id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NULL,
    `shop_id` INTEGER NULL DEFAULT 0,
    `shipping_fee` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `discount_amount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `coupon_amount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `time_discount_amount` DECIMAL(10, 2) NULL DEFAULT 0.00,

    PRIMARY KEY (`order_discount_detail_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_config` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `code` VARCHAR(50) NOT NULL DEFAULT '',
    `data` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_coupon_detail` (
    `order_coupon_detail_id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NULL,
    `shop_id` INTEGER NULL DEFAULT 0,
    `coupon_id` INTEGER NULL DEFAULT 0,
    `coupon_fee` DECIMAL(10, 2) NULL DEFAULT 0.00,

    PRIMARY KEY (`order_coupon_detail_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_invoice` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `order_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `invoice_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `apply_reply` VARCHAR(255) NOT NULL DEFAULT '',
    `title_type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `company_code` VARCHAR(80) NOT NULL DEFAULT '',
    `company_name` VARCHAR(80) NOT NULL DEFAULT '',
    `company_address` VARCHAR(120) NOT NULL DEFAULT '',
    `company_phone` VARCHAR(80) NOT NULL DEFAULT '',
    `company_bank` VARCHAR(80) NOT NULL DEFAULT '',
    `company_account` VARCHAR(80) NOT NULL DEFAULT '',
    `invoice_content` VARCHAR(80) NOT NULL DEFAULT '商品明细',
    `invoice_no` VARCHAR(80) NOT NULL DEFAULT '',
    `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `mobile` VARCHAR(80) NOT NULL DEFAULT '',
    `email` VARCHAR(80) NOT NULL DEFAULT '',
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `invoice_attachment` TEXT NULL,
    `invoicing_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_item` (
    `item_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `order_sn` VARCHAR(60) NOT NULL DEFAULT '',
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `quantity` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    `product_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `product_name` VARCHAR(500) NOT NULL DEFAULT '',
    `product_sn` VARCHAR(60) NOT NULL DEFAULT '',
    `pic_thumb` VARCHAR(255) NOT NULL DEFAULT '',
    `sku_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `sku_data` TEXT NOT NULL,
    `delivery_quantity` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `product_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `is_gift` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `shop_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `is_pin` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `prepay_price` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    `commission` VARCHAR(255) NULL DEFAULT '',
    `origin_price` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `promotion_data` TEXT NULL,
    `is_seckill` TINYINT NULL DEFAULT 0,
    `extra_sku_data` TEXT NULL,
    `suppliers_id` INTEGER UNSIGNED NULL DEFAULT 0,
    `card_group_name` VARCHAR(255) NOT NULL DEFAULT '',
    `vendor_product_id` INTEGER NULL,
    `vendor_product_sku_id` INTEGER NULL,
    `vendor_id` INTEGER NULL,

    INDEX `goods_id`(`product_id`),
    INDEX `idx_vendor_id`(`vendor_id`),
    INDEX `idx_vendor_product_id`(`vendor_product_id`),
    INDEX `idx_vendor_product_sku_id`(`vendor_product_sku_id`),
    INDEX `order_id`(`order_id`),
    PRIMARY KEY (`item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_log` (
    `log_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `order_sn` VARCHAR(80) NOT NULL DEFAULT '',
    `admin_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `description` VARCHAR(255) NOT NULL DEFAULT '',
    `log_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `shop_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `order_id`(`order_id`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_split_log` (
    `log_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `parent_order_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `order_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `split_time` INTEGER UNSIGNED NOT NULL,
    `parent_order_data` TEXT NULL,

    INDEX `add_time`(`parent_order_id`),
    INDEX `order_id`(`order_id`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paylog` (
    `paylog_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `pay_sn` VARCHAR(255) NOT NULL DEFAULT '',
    `pay_name` VARCHAR(255) NOT NULL DEFAULT '',
    `order_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `order_sn` VARCHAR(255) NOT NULL DEFAULT '',
    `order_amount` DECIMAL(10, 2) NOT NULL,
    `order_type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `pay_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `pay_status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `pay_code` VARCHAR(255) NOT NULL DEFAULT '',
    `add_time` INTEGER UNSIGNED NULL DEFAULT 0,
    `transaction_id` VARCHAR(80) NOT NULL DEFAULT '',
    `notify_data` TEXT NOT NULL,
    `refund_amount` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    `token_code` VARCHAR(255) NOT NULL DEFAULT '',
    `appid` VARCHAR(255) NULL,

    INDEX `order_id`(`order_id`),
    INDEX `pay_status`(`pay_status`),
    PRIMARY KEY (`paylog_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paylog_refund` (
    `paylog_refund_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `paylog_id` INTEGER UNSIGNED NULL DEFAULT 0,
    `refund_sn` VARCHAR(255) NULL DEFAULT '',
    `paylog_desc` VARCHAR(255) NOT NULL DEFAULT '',
    `order_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `refund_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `add_time` INTEGER UNSIGNED NULL DEFAULT 0,
    `admin_id` MEDIUMINT NOT NULL DEFAULT 0,
    `pay_code` VARCHAR(255) NULL DEFAULT '',
    `status` BOOLEAN NULL DEFAULT false,
    `notify_time` INTEGER NULL DEFAULT 0,

    INDEX `order_id`(`order_id`),
    INDEX `paylog_id`(`paylog_id`),
    PRIMARY KEY (`paylog_refund_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pc_cat_floor` (
    `cat_floor_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `cat_floor_name` VARCHAR(255) NOT NULL DEFAULT '',
    `category_ids` VARCHAR(255) NOT NULL DEFAULT '',
    `category_names` VARCHAR(255) NOT NULL DEFAULT '',
    `floor_ico` VARCHAR(255) NOT NULL DEFAULT '',
    `hot_cat` TEXT NOT NULL,
    `is_show` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `sort_order` INTEGER UNSIGNED NOT NULL DEFAULT 50,
    `floor_ico_font` VARCHAR(80) NOT NULL DEFAULT '',
    `brand_ids` VARCHAR(255) NOT NULL DEFAULT '',

    INDEX `is_show`(`is_show`),
    PRIMARY KEY (`cat_floor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pc_navigation` (
    `id` MEDIUMINT NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL DEFAULT '',
    `is_show` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` BOOLEAN NOT NULL DEFAULT false,
    `is_blank` BOOLEAN NOT NULL DEFAULT false,
    `link` TEXT NOT NULL,
    `type` TINYINT NOT NULL DEFAULT 0,
    `parent_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `icon` VARCHAR(255) NOT NULL DEFAULT '',

    INDEX `is_show`(`is_show`),
    INDEX `parent_id`(`parent_id`),
    INDEX `type`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `points_exchange` (
    `id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `product_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `exchange_integral` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `points_deducted_amount` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    `is_hot` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_enabled` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `sku_id` INTEGER NULL DEFAULT 0,

    INDEX `is_enabled`(`is_enabled`),
    INDEX `is_hot`(`is_hot`),
    INDEX `product_id`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `price_inquiry` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `mobile` VARCHAR(50) NOT NULL DEFAULT '',
    `content` VARCHAR(255) NOT NULL DEFAULT '',
    `product_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `remark` VARCHAR(255) NOT NULL DEFAULT '',
    `status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `create_time` INTEGER UNSIGNED NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `print` (
    `print_id` INTEGER NOT NULL AUTO_INCREMENT,
    `print_name` VARCHAR(255) NOT NULL,
    `print_sn` VARCHAR(255) NOT NULL,
    `print_key` VARCHAR(255) NOT NULL,
    `third_account` VARCHAR(255) NOT NULL,
    `third_key` VARCHAR(255) NOT NULL,
    `print_number` INTEGER NULL DEFAULT 0,
    `platform` BOOLEAN NULL DEFAULT true,
    `shop_id` INTEGER NULL DEFAULT 0,
    `status` TINYINT NULL DEFAULT 1,
    `add_time` INTEGER NULL DEFAULT 0,
    `update_time` INTEGER NULL DEFAULT 0,
    `delete_time` INTEGER NULL DEFAULT 0,
    `auto_print` TINYINT NULL DEFAULT 2,

    INDEX `print_sn`(`print_sn`),
    INDEX `shop_id`(`shop_id`),
    PRIMARY KEY (`print_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `print_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `print_id` INTEGER NOT NULL,
    `template` TEXT NOT NULL,
    `type` BOOLEAN NULL DEFAULT true,
    `add_time` INTEGER NULL DEFAULT 0,
    `update_time` INTEGER NULL DEFAULT 0,

    INDEX `print_id`(`print_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product` (
    `product_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `product_name` VARCHAR(120) NOT NULL DEFAULT '',
    `product_sn` VARCHAR(60) NOT NULL DEFAULT '',
    `product_tsn` VARCHAR(255) NULL,
    `product_stock` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `product_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `market_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `shipping_tpl_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `product_status` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `product_type` BOOLEAN NULL DEFAULT true,
    `category_id` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `brand_id` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `keywords` VARCHAR(255) NULL DEFAULT '',
    `shop_category_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `check_status` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `check_reason` VARCHAR(255) NOT NULL DEFAULT '',
    `click_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `product_weight` DECIMAL(10, 3) NOT NULL DEFAULT 0.000,
    `is_promote` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_promote_activity` BOOLEAN NOT NULL DEFAULT false,
    `promote_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `promote_start_date` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `promote_end_date` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `seckill_max_num` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `product_brief` VARCHAR(255) NOT NULL DEFAULT '',
    `product_desc` TEXT NULL,
    `pic_url` VARCHAR(255) NOT NULL DEFAULT '',
    `pic_thumb` VARCHAR(255) NOT NULL DEFAULT '',
    `pic_original` VARCHAR(255) NOT NULL DEFAULT '',
    `comment_tag` VARCHAR(255) NULL,
    `free_shipping` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `integral` INTEGER NOT NULL DEFAULT 0,
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 100,
    `store_sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 100,
    `is_delete` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_best` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_new` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_hot` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `last_update` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `remark` VARCHAR(255) NOT NULL DEFAULT '',
    `give_integral` INTEGER NOT NULL DEFAULT -1,
    `rank_integral` INTEGER NOT NULL DEFAULT -1,
    `suppliers_id` SMALLINT UNSIGNED NULL,
    `virtual_sales` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `limit_number` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `product_care` TEXT NULL,
    `product_related` TEXT NULL,
    `product_service_ids` TEXT NULL,
    `is_support_return` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_support_cod` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `product_video` TEXT NULL,
    `prepay_price` DECIMAL(8, 2) NULL DEFAULT 0.00,
    `card_group_id` INTEGER NOT NULL DEFAULT 0,
    `virtual_sample` TEXT NULL,
    `paid_content` TEXT NULL,
    `no_shipping` TINYINT NULL DEFAULT 0,
    `fixed_shipping_type` TINYINT NULL DEFAULT 2,
    `fixed_shipping_fee` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `vendor_product_id` INTEGER NULL,
    `vendor_id` INTEGER NULL,

    INDEX `brand_id`(`brand_id`),
    INDEX `cat_id`(`category_id`),
    INDEX `goods_basesell`(`virtual_sales`),
    INDEX `goods_number`(`product_stock`),
    INDEX `goods_sn`(`product_sn`),
    INDEX `goods_weight`(`product_weight`),
    INDEX `idx_vendor_id`(`vendor_id`),
    INDEX `idx_vendor_product_id`(`vendor_product_id`),
    INDEX `keywords`(`keywords`),
    INDEX `last_update`(`last_update`),
    INDEX `product_name`(`product_name`),
    INDEX `promote_end_date`(`promote_end_date`),
    INDEX `promote_start_date`(`promote_start_date`),
    INDEX `sort_order`(`sort_order`),
    INDEX `store_id`(`shop_id`),
    PRIMARY KEY (`product_id`, `brand_id`, `product_weight`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_article` (
    `goods_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `article_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `goods_id`(`goods_id`),
    PRIMARY KEY (`goods_id`, `article_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_attributes_tpl` (
    `tpl_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `tpl_name` VARCHAR(80) NOT NULL DEFAULT '',
    `tpl_data` TEXT NOT NULL,
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`tpl_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_gallery` (
    `pic_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `product_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `pic_url` VARCHAR(255) NOT NULL DEFAULT '',
    `pic_desc` VARCHAR(255) NOT NULL DEFAULT '',
    `pic_thumb` VARCHAR(255) NOT NULL DEFAULT '',
    `pic_original` VARCHAR(255) NOT NULL DEFAULT '',
    `pic_large` VARCHAR(255) NOT NULL DEFAULT '',
    `sort_order` INTEGER UNSIGNED NOT NULL DEFAULT 1,

    INDEX `goods_id`(`product_id`),
    PRIMARY KEY (`pic_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_gift` (
    `gift_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `gift_name` VARCHAR(50) NOT NULL DEFAULT '',
    `gift_stock` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `product_id` INTEGER NOT NULL,
    `sku_id` INTEGER NOT NULL DEFAULT 0,
    `shop_id` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`gift_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_group` (
    `product_group_id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_group_name` VARCHAR(255) NULL DEFAULT '',
    `product_group_sn` VARCHAR(255) NULL DEFAULT '',
    `product_group_description` VARCHAR(255) NULL DEFAULT '',
    `product_ids` TEXT NULL,
    `add_time` INTEGER NULL DEFAULT 0,
    `shop_id` INTEGER NULL DEFAULT 0,

    INDEX `shop_id`(`shop_id`),
    PRIMARY KEY (`product_group_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_inventory_log` (
    `log_id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NULL DEFAULT 0,
    `spec_id` INTEGER NULL DEFAULT 0,
    `number` INTEGER NULL DEFAULT 0,
    `add_time` INTEGER NULL DEFAULT 0,
    `old_number` INTEGER NULL DEFAULT 0,
    `type` BOOLEAN NULL DEFAULT true,
    `change_number` INTEGER NULL DEFAULT 0,
    `desc` VARCHAR(255) NULL DEFAULT '',
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    INDEX `product_id`(`product_id`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_member_price` (
    `price_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `product_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `user_rank` TINYINT NOT NULL DEFAULT 0,
    `user_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    INDEX `goods_id`(`product_id`, `user_rank`),
    PRIMARY KEY (`price_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_package` (
    `package_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `package_name` VARCHAR(255) NOT NULL DEFAULT '',
    `package_desc` TEXT NOT NULL,
    `package_type` TINYINT UNSIGNED NOT NULL,
    `product_id` MEDIUMINT UNSIGNED NOT NULL,
    `start_time` INTEGER UNSIGNED NOT NULL,
    `end_time` INTEGER UNSIGNED NOT NULL,
    `is_finished` TINYINT UNSIGNED NOT NULL,
    `ext_info` TEXT NOT NULL,
    `store_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `act_name`(`package_name`, `package_type`, `product_id`),
    INDEX `store_id`(`store_id`),
    PRIMARY KEY (`package_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_promotion` (
    `promotion_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `promotion_name` VARCHAR(100) NOT NULL DEFAULT '',
    `start_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `end_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `limit_user_rank` VARCHAR(255) NOT NULL DEFAULT '',
    `range` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `range_data` TEXT NOT NULL,
    `min_order_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `max_order_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `promotion_type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `promotion_type_data` TEXT NOT NULL,
    `is_available` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 50,
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `rules_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `unit` TINYINT UNSIGNED NOT NULL DEFAULT 1,

    INDEX `act_name`(`promotion_name`),
    PRIMARY KEY (`promotion_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_related` (
    `product_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `related_product_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `product_id`(`product_id`),
    INDEX `related_product_id`(`related_product_id`),
    PRIMARY KEY (`product_id`, `related_product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_services` (
    `product_service_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `product_service_name` VARCHAR(120) NOT NULL DEFAULT '',
    `product_service_desc` VARCHAR(255) NOT NULL DEFAULT '',
    `ico_img` VARCHAR(255) NOT NULL DEFAULT '',
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 50,
    `default_on` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    INDEX `shop_id`(`shop_id`),
    PRIMARY KEY (`product_service_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_sku` (
    `sku_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `product_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `sku_value` VARCHAR(255) NOT NULL DEFAULT '',
    `sku_data` TEXT NULL,
    `sku_sn` VARCHAR(60) NULL DEFAULT '',
    `sku_stock` INTEGER UNSIGNED NULL DEFAULT 0,
    `sku_tsn` VARCHAR(120) NULL DEFAULT '',
    `sku_price` DECIMAL(8, 2) NULL DEFAULT 0.00,
    `vendor_product_sku_id` INTEGER NULL,

    INDEX `product_id`(`product_id`),
    PRIMARY KEY (`sku_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_video` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `video_id` MEDIUMINT UNSIGNED NOT NULL,
    `product_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `video_url` VARCHAR(255) NOT NULL DEFAULT '',
    `video_cover` VARCHAR(255) NOT NULL DEFAULT '',
    `format` VARCHAR(100) NOT NULL DEFAULT '',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promotion` (
    `promotion_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `promotion_name` VARCHAR(255) NOT NULL DEFAULT '',
    `start_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `end_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `type` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `relation_id` INTEGER NULL DEFAULT 0,
    `range` TINYINT NULL DEFAULT 0,
    `range_data` TEXT NULL,
    `sku_ids` TEXT NULL,
    `is_available` TINYINT NULL DEFAULT 1,
    `is_delete` BOOLEAN NULL DEFAULT false,

    INDEX `end_time`(`end_time`),
    INDEX `relation_id`(`relation_id`),
    INDEX `shop_id`(`shop_id`),
    INDEX `start_time`(`start_time`),
    INDEX `type`(`type`),
    PRIMARY KEY (`promotion_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rank_growth_log` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `growth_points` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `change_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `create_time` INTEGER UNSIGNED NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recharge_setting` (
    `recharge_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `money` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `discount_money` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `sort_order` TINYINT NULL DEFAULT 1,
    `is_show` BOOLEAN NULL DEFAULT true,

    INDEX `is_show`(`is_show`),
    PRIMARY KEY (`recharge_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refund_apply` (
    `refund_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `refund_type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `order_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `user_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `aftersale_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `refund_status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `refund_note` VARCHAR(255) NOT NULL DEFAULT '',
    `online_balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `offline_balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `refund_balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `is_online` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_offline` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_receive` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `paylog_refund_id` INTEGER NOT NULL DEFAULT 0,
    `shop_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `payment_voucher` TEXT NULL,

    INDEX `aftersale_id`(`aftersale_id`),
    INDEX `order_id`(`order_id`),
    INDEX `rec_id`(`aftersale_id`),
    INDEX `refund_status`(`refund_status`),
    INDEX `refund_type`(`refund_type`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`refund_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refund_log` (
    `log_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `refund_apply_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `refund_type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `refund_pay_code` VARCHAR(80) NOT NULL DEFAULT '',
    `transaction_id` VARCHAR(80) NOT NULL DEFAULT '',
    `refund_amount` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `description` TEXT NULL,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `order_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `order_id`(`order_id`),
    INDEX `refund_id`(`refund_apply_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `region` (
    `region_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `level` TINYINT UNSIGNED NULL DEFAULT 0,
    `region_name` VARCHAR(120) NOT NULL DEFAULT '',
    `parent_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `is_hot` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `first_word` VARCHAR(50) NOT NULL DEFAULT '',

    INDEX `level`(`level`),
    INDEX `parent_id`(`parent_id`),
    PRIMARY KEY (`region_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salesman` (
    `salesman_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `level` INTEGER NULL DEFAULT 1,
    `group_id` INTEGER NULL DEFAULT 0,
    `pid` INTEGER NOT NULL DEFAULT 0,
    `add_time` INTEGER NULL,
    `shop_id` INTEGER NULL,
    `sale_amount` DECIMAL(10, 2) NULL DEFAULT 0.00,

    PRIMARY KEY (`salesman_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salesman_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop_id` INTEGER NULL,
    `code` VARCHAR(255) NULL,
    `data` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salesman_content` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL DEFAULT '',
    `img` VARCHAR(255) NOT NULL DEFAULT '',
    `start_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `end_time` INTEGER UNSIGNED NULL DEFAULT 0,
    `describe` VARCHAR(255) NOT NULL DEFAULT '',
    `is_top` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `content` TEXT NULL,
    `is_available` TINYINT UNSIGNED NULL DEFAULT 1,
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `pics` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salesman_customer` (
    `salesman_customer_id` INTEGER NOT NULL AUTO_INCREMENT,
    `salesman_id` INTEGER NULL,
    `user_id` INTEGER NULL,
    `add_time` INTEGER NULL,

    PRIMARY KEY (`salesman_customer_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salesman_group` (
    `group_id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_name` VARCHAR(255) NULL,
    `describe` VARCHAR(255) NULL DEFAULT '',
    `add_time` INTEGER NULL,
    `shop_id` INTEGER NULL,

    PRIMARY KEY (`group_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salesman_material` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `is_top` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `content` TEXT NULL,
    `is_available` TINYINT UNSIGNED NULL DEFAULT 1,
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `pics` TEXT NULL,
    `category_id` INTEGER NULL,
    `share_num` INTEGER NULL DEFAULT 0,
    `product_id` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salesman_material_category` (
    `category_id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(255) NULL,
    `add_time` INTEGER NULL,
    `shop_id` INTEGER NULL,
    `sort_order` INTEGER NULL,

    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salesman_order` (
    `salesman_order_id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NULL,
    `salesman_id` INTEGER NULL,
    `amount` DECIMAL(10, 2) NULL,
    `status` TINYINT NULL DEFAULT 0,
    `add_time` INTEGER NULL,
    `item_id` INTEGER NULL,
    `salesman_product_data` TEXT NULL,
    `order_amount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `salesman_settlement_data` TEXT NULL,
    `settlement_time` INTEGER UNSIGNED NULL,
    `product_id` INTEGER UNSIGNED NULL DEFAULT 0,

    PRIMARY KEY (`salesman_order_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `salesman_product` (
    `salesman_product_id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NULL,
    `is_join` TINYINT NULL DEFAULT 0,
    `commission_type` TINYINT NULL DEFAULT 1,
    `commission_data` TEXT NULL,
    `add_time` INTEGER NULL,
    `update_time` INTEGER NULL,
    `shop_id` INTEGER NULL,

    PRIMARY KEY (`salesman_product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seckill` (
    `seckill_id` INTEGER NOT NULL AUTO_INCREMENT,
    `seckill_name` VARCHAR(255) NULL DEFAULT '',
    `seckill_start_time` INTEGER NULL DEFAULT 0,
    `seckill_end_time` INTEGER NULL DEFAULT 0,
    `seckill_limit_num` INTEGER NULL DEFAULT 0,
    `product_id` INTEGER NULL DEFAULT 0,
    `shop_id` INTEGER NOT NULL DEFAULT 0,

    INDEX `product_id`(`product_id`),
    INDEX `seckill_end_time`(`seckill_end_time`),
    INDEX `seckill_start_time`(`seckill_start_time`),
    PRIMARY KEY (`seckill_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `seckill_item` (
    `rec_id` INTEGER NOT NULL AUTO_INCREMENT,
    `seckill_id` INTEGER UNSIGNED NULL DEFAULT 0,
    `product_id` INTEGER UNSIGNED NULL DEFAULT 0,
    `sku_id` INTEGER NULL DEFAULT 0,
    `seckill_price` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `seckill_stock` INTEGER UNSIGNED NULL DEFAULT 0,
    `seckill_sales` INTEGER UNSIGNED NULL DEFAULT 0,
    `seckill_start_time` INTEGER UNSIGNED NULL,
    `seckill_end_time` INTEGER UNSIGNED NULL,

    INDEX `product_id`(`product_id`),
    INDEX `seckill_id`(`seckill_id`),
    INDEX `sku_id`(`sku_id`),
    PRIMARY KEY (`rec_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sensitive_words` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `word` VARCHAR(30) NOT NULL DEFAULT '',

    UNIQUE INDEX `word`(`word`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shipping_tpl` (
    `shipping_tpl_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `shipping_time` VARCHAR(255) NOT NULL DEFAULT '',
    `shipping_tpl_name` VARCHAR(120) NOT NULL DEFAULT '',
    `is_free` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `pricing_type` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `is_default` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `shop_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `shipping_tpl_id`(`shipping_tpl_id`),
    INDEX `store_id`(`shop_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shipping_tpl_info` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `shipping_type_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `shipping_tpl_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `is_free` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_default` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `region_data` TEXT NULL,
    `start_number` DECIMAL(10, 1) NOT NULL DEFAULT 0.0,
    `start_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `add_number` DECIMAL(10, 1) NOT NULL DEFAULT 0.0,
    `add_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `free_price` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    `pricing_type` BOOLEAN NOT NULL DEFAULT true,

    INDEX `is_free`(`is_free`),
    INDEX `shipping_tpl_id`(`shipping_tpl_id`),
    INDEX `shipping_type_id`(`shipping_type_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shipping_type` (
    `shipping_type_id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `shipping_type_name` VARCHAR(120) NOT NULL DEFAULT '',
    `shipping_default_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `shipping_type_desc` VARCHAR(255) NOT NULL DEFAULT '',
    `shipping_time_desc` VARCHAR(255) NOT NULL DEFAULT '',
    `is_support_cod` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 50,
    `shop_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`shipping_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shop` (
    `shop_id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop_title` VARCHAR(255) NULL DEFAULT '',
    `add_time` INTEGER NULL DEFAULT 0,
    `shop_logo` VARCHAR(255) NULL DEFAULT '',
    `click_count` INTEGER NULL DEFAULT 0,
    `status` TINYINT NULL DEFAULT 1,
    `merchant_id` INTEGER UNSIGNED NULL DEFAULT 0,
    `shop_money` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `frozen_money` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `contact_mobile` VARCHAR(255) NULL DEFAULT '',
    `description` VARCHAR(255) NULL DEFAULT '',
    `kefu_phone` VARCHAR(20) NULL DEFAULT '',
    `kefu_weixin` VARCHAR(30) NULL DEFAULT '',
    `kefu_link` VARCHAR(255) NULL DEFAULT '',
    `is_contact_kefu` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `kefu_inlet` TEXT NULL,
    `last_login_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `vendor_set_price_type` TINYINT NULL DEFAULT 3,
    `vendor_set_price_auto_value` DECIMAL(10, 2) NULL,
    `service_fee_rate` DECIMAL(10, 2) NULL,
    `fee_rate` DECIMAL(10, 2) NULL,

    PRIMARY KEY (`shop_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shop_account_log` (
    `shop_account_log_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `shop_money` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `frozen_money` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `type` VARCHAR(60) NOT NULL DEFAULT '',
    `remarks` TEXT NULL,
    `new_shop_money` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `new_frozen_money` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `is_new` BOOLEAN NOT NULL DEFAULT false,

    INDEX `shop_id`(`shop_id`),
    INDEX `type`(`type`),
    PRIMARY KEY (`shop_account_log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shop_product_category` (
    `category_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(90) NOT NULL DEFAULT '',
    `shop_id` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `parent_id` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 50,
    `is_show` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `add_time` INTEGER NULL DEFAULT 0,

    INDEX `parent_id`(`parent_id`),
    INDEX `shop_id`(`shop_id`),
    PRIMARY KEY (`category_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shop_withdraw` (
    `shop_withdraw_log_id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `add_time` INTEGER UNSIGNED NOT NULL,
    `remark` TEXT NOT NULL,
    `merchant_account_id` INTEGER NULL,
    `account_data` TEXT NULL,
    `audit_remark` VARCHAR(255) NULL,
    `payment_voucher` TEXT NULL,
    `withdraw_sn` VARCHAR(32) NOT NULL,

    PRIMARY KEY (`shop_withdraw_log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sign` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL DEFAULT 0,
    `add_time` INTEGER NULL DEFAULT 0,
    `sign_num` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sign_in_setting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NULL DEFAULT '',
    `points` INTEGER NULL DEFAULT 0,
    `day_num` INTEGER NULL DEFAULT 0,

    INDEX `day_num`(`day_num`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sms_log` (
    `sms_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `mobile` VARCHAR(20) NOT NULL DEFAULT '',
    `send_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `content` TEXT NOT NULL,
    `status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `batch_mobile` TEXT NOT NULL,
    `error_content` VARCHAR(255) NOT NULL DEFAULT '',

    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`sms_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statement` (
    `statement_id` BIGINT NOT NULL AUTO_INCREMENT,
    `shop_id` INTEGER NULL,
    `record_id` INTEGER NULL,
    `record_sn` VARCHAR(32) NULL,
    `record_time` BIGINT NULL,
    `settlement_time` BIGINT NULL,
    `vendor_id` INTEGER NULL,
    `account_type` INTEGER NULL,
    `type` INTEGER NULL,
    `entry_type` VARCHAR(50) NOT NULL,
    `payment_type` VARCHAR(50) NULL,
    `account_balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `amount` DECIMAL(10, 2) NOT NULL,
    `gmt_create` VARCHAR(64) NULL,
    `statement_year` INTEGER NULL,
    `statement_month` INTEGER NULL,
    `statement_day` INTEGER NULL,
    `settlement_status` INTEGER NULL,

    PRIMARY KEY (`statement_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statement_download` (
    `statement_download_id` BIGINT NOT NULL AUTO_INCREMENT,
    `vendor_id` BIGINT NULL,
    `shop_id` BIGINT NULL,
    `gmt_create` BIGINT NULL,
    `start_time` BIGINT NULL,
    `end_time` BIGINT NULL,
    `remark` VARCHAR(255) NULL,

    PRIMARY KEY (`statement_download_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statement_output` (
    `statement_output_id` BIGINT NOT NULL,
    `shop_id` INTEGER NULL,
    `vendor_id` INTEGER NULL,
    `income` DECIMAL(10, 2) NULL,
    `expenditure` DECIMAL(10, 2) NULL,
    `gmt_create` BIGINT NULL,
    `record_sn` VARCHAR(32) NULL,
    `record_type` INTEGER NULL,
    `record_id` INTEGER NULL,
    `settlement_status` BIGINT NULL,

    PRIMARY KEY (`statement_output_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statistics_base` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NULL,
    `click_count` INTEGER NULL DEFAULT 0,
    `shop_id` INTEGER NULL DEFAULT 0,
    `visitor_count` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statistics_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `access_time` INTEGER NULL,
    `shop_id` INTEGER NULL DEFAULT 0,
    `product_id` INTEGER NULL DEFAULT 0,
    `shop_category_id` INTEGER NOT NULL DEFAULT 0,
    `user` VARCHAR(50) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `suppliers` (
    `suppliers_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `suppliers_name` VARCHAR(255) NULL DEFAULT '',
    `suppliers_desc` MEDIUMTEXT NULL,
    `is_check` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `country` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `province` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `city` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `district` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `contact_name` VARCHAR(255) NULL DEFAULT '',
    `contact_phone` VARCHAR(255) NULL DEFAULT '',
    `contact_address` VARCHAR(255) NULL DEFAULT '',
    `is_show` BOOLEAN NULL DEFAULT false,
    `shop_id` INTEGER NULL DEFAULT 0,

    INDEX `is_show`(`is_show`),
    INDEX `shop_id`(`shop_id`),
    PRIMARY KEY (`suppliers_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `time_discount` (
    `discount_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `promotion_name` VARCHAR(255) NOT NULL DEFAULT '',
    `start_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `end_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `add_time` INTEGER NULL DEFAULT 0,

    INDEX `end_time`(`end_time`),
    INDEX `shop_id`(`shop_id`),
    INDEX `start_time`(`start_time`),
    PRIMARY KEY (`discount_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `time_discount_item` (
    `item_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `discount_id` SMALLINT NOT NULL DEFAULT 0,
    `start_time` INTEGER NOT NULL DEFAULT 0,
    `end_time` INTEGER NOT NULL DEFAULT 0,
    `product_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `sku_ids` TEXT NULL,
    `value` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `discount_type` TINYINT NOT NULL DEFAULT 1,

    INDEX `discount_id`(`discount_id`),
    INDEX `product_id`(`product_id`),
    PRIMARY KEY (`item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `translations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `translation_name` TEXT NULL,
    `translation_key` VARCHAR(255) NULL,
    `data_type` TINYINT NULL DEFAULT 0,
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `translations_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `locale_id` INTEGER NULL,
    `translation_name` TEXT NULL,
    `translation_key` VARCHAR(255) NULL,
    `translation_value` TEXT NULL,
    `data_type` TINYINT NULL DEFAULT 0,
    `data_id` INTEGER NULL,

    INDEX `data_id`(`data_id`),
    INDEX `data_type`(`data_type`),
    INDEX `locale_id`(`locale_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unipush_log` (
    `unipush_log_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(80) NOT NULL DEFAULT '',
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `data` TEXT NOT NULL,
    `respond_data` TEXT NOT NULL,
    `is_success` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `user_ids` INTEGER NULL DEFAULT 0,
    `message_title` VARCHAR(255) NULL DEFAULT '',
    `message_content` TEXT NULL,
    `send_user_type` BOOLEAN NULL DEFAULT false,

    INDEX `add_time`(`add_time`),
    PRIMARY KEY (`unipush_log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `user_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(60) NOT NULL DEFAULT '',
    `avatar` VARCHAR(255) NOT NULL DEFAULT '',
    `mobile` VARCHAR(20) NOT NULL DEFAULT '',
    `mobile_validated` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `email` VARCHAR(60) NOT NULL DEFAULT '',
    `email_validated` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `nickname` VARCHAR(80) NULL DEFAULT '',
    `password` VARCHAR(80) NOT NULL DEFAULT '',
    `birthday` DATE NULL,
    `balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `frozen_balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `points` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `growth_points` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `address_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `reg_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `last_login` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `last_ip` VARCHAR(15) NOT NULL DEFAULT '',
    `rank_id` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `referrer_user_id` MEDIUMINT NOT NULL DEFAULT 0,
    `from_tag` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_svip` BOOLEAN NULL DEFAULT false,
    `svip_expire_time` INTEGER NULL DEFAULT 0,
    `order_count` MEDIUMINT NOT NULL DEFAULT 0,
    `order_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `history_product_ids` TEXT NULL,
    `is_distribution` BOOLEAN NULL DEFAULT false,
    `distribution_register_time` INTEGER NULL DEFAULT 0,
    `wechat_img` VARCHAR(255) NOT NULL DEFAULT '',
    `is_company_auth` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `status` TINYINT NULL DEFAULT 1,

    UNIQUE INDEX `username`(`username`),
    INDEX `email`(`email`),
    INDEX `is_distribution`(`is_distribution`),
    INDEX `parent_id`(`referrer_user_id`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_address` (
    `address_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `address_tag` VARCHAR(50) NOT NULL DEFAULT '',
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `consignee` VARCHAR(60) NOT NULL DEFAULT '',
    `email` VARCHAR(60) NULL DEFAULT '',
    `region_ids` TEXT NOT NULL,
    `region_names` TEXT NOT NULL,
    `address` VARCHAR(120) NOT NULL DEFAULT '',
    `postcode` VARCHAR(60) NULL DEFAULT '',
    `telephone` VARCHAR(60) NULL DEFAULT '',
    `mobile` VARCHAR(60) NOT NULL DEFAULT '',
    `is_default` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `is_selected` TINYINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`address_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_authorize` (
    `authorize_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `authorize_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `user_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `open_id` VARCHAR(255) NOT NULL DEFAULT '',
    `open_data` TEXT NOT NULL,
    `open_name` VARCHAR(80) NOT NULL DEFAULT '',
    `open_photo` VARCHAR(255) NOT NULL DEFAULT '',
    `unionid` VARCHAR(200) NULL DEFAULT '',
    `add_time` INTEGER NULL DEFAULT 0,

    INDEX `authorize_type`(`authorize_type`),
    INDEX `open_id`(`open_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`authorize_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_balance_log` (
    `log_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `frozen_balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `new_balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `new_frozen_balance` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `change_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `change_desc` VARCHAR(255) NOT NULL DEFAULT '',
    `change_type` TINYINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `change_type`(`change_type`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_company` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `type` TINYINT UNSIGNED NOT NULL DEFAULT 2,
    `contact_name` VARCHAR(80) NOT NULL DEFAULT '',
    `contact_mobile` VARCHAR(32) NOT NULL DEFAULT '',
    `company_name` VARCHAR(255) NOT NULL DEFAULT '',
    `company_data` TEXT NULL,
    `status` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `audit_remark` VARCHAR(255) NOT NULL DEFAULT '',
    `audit_time` INTEGER UNSIGNED NULL DEFAULT 0,
    `add_time` INTEGER UNSIGNED NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_coupon` (
    `id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `coupon_id` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `coupon_sn` VARCHAR(80) NOT NULL DEFAULT '',
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `used_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `order_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `start_date` INTEGER NOT NULL DEFAULT 0,
    `end_date` INTEGER NOT NULL DEFAULT 0,

    INDEX `end_date`(`end_date`),
    INDEX `order_id`(`order_id`),
    INDEX `start_date`(`start_date`),
    INDEX `used_time`(`used_time`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_growth_points_log` (
    `log_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `points` MEDIUMINT NOT NULL DEFAULT 0,
    `change_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `change_desc` VARCHAR(255) NOT NULL DEFAULT '',
    `change_type` TINYINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_invoice` (
    `invoice_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `apply_reply` VARCHAR(255) NOT NULL DEFAULT '',
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `title_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `company_name` VARCHAR(80) NOT NULL DEFAULT '',
    `company_code` VARCHAR(80) NOT NULL DEFAULT '',
    `company_address` VARCHAR(120) NOT NULL DEFAULT '',
    `company_phone` VARCHAR(80) NOT NULL DEFAULT '',
    `company_bank` VARCHAR(80) NOT NULL DEFAULT '',
    `company_account` VARCHAR(80) NOT NULL DEFAULT '',
    `mobile` VARCHAR(80) NOT NULL DEFAULT '',
    `email` VARCHAR(80) NOT NULL DEFAULT '',
    `invoice_content` VARCHAR(80) NOT NULL DEFAULT '商品明细',

    INDEX `user_id`(`user_id`, `status`),
    PRIMARY KEY (`invoice_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_message` (
    `message_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `message_log_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `user_rank` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `is_read` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `title` VARCHAR(255) NOT NULL DEFAULT '',
    `content` TEXT NOT NULL,
    `link` VARCHAR(255) NOT NULL DEFAULT '',
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    INDEX `message_log_id`(`message_log_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`message_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_message_log` (
    `message_log_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `message_type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `send_user_type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `user_ids` TEXT NOT NULL,
    `user_rank` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `message_title` VARCHAR(255) NOT NULL DEFAULT '',
    `message_content` TEXT NOT NULL,
    `message_link` VARCHAR(255) NOT NULL DEFAULT '',
    `send_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `is_recall` TINYINT UNSIGNED NOT NULL DEFAULT 0,

    INDEX `send_user_type`(`send_user_type`),
    PRIMARY KEY (`message_log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_points_log` (
    `log_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `points` MEDIUMINT NOT NULL DEFAULT 0,
    `change_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `change_desc` VARCHAR(255) NOT NULL DEFAULT '',
    `change_type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `relation_type` TINYINT NULL,
    `relation_id` INTEGER NULL,

    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_rank` (
    `rank_id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `rank_name` VARCHAR(30) NOT NULL DEFAULT '',
    `min_growth_points` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `max_growth_points` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `discount` DECIMAL(4, 1) NOT NULL DEFAULT 0.0,
    `show_price` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `rank_type` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `rank_logo` VARCHAR(255) NOT NULL DEFAULT '',
    `rank_ico` VARCHAR(255) NOT NULL DEFAULT '',
    `rank_bg` VARCHAR(255) NOT NULL DEFAULT '',
    `rank_point` VARCHAR(30) NOT NULL DEFAULT '0',
    `free_shipping` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `rank_card_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `rights` TEXT NULL,
    `rank_level` VARCHAR(30) NOT NULL DEFAULT '',

    PRIMARY KEY (`rank_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_rank_config` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(30) NOT NULL DEFAULT '',
    `rank_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `data` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_rank_log` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `rank_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `rank_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `rank_name` VARCHAR(30) NOT NULL DEFAULT '',
    `change_time` INTEGER UNSIGNED NULL DEFAULT 0,
    `remark` VARCHAR(255) NOT NULL DEFAULT '',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_recharge_order` (
    `order_id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `discount_money` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `add_time` INTEGER NOT NULL DEFAULT 0,
    `paid_time` INTEGER NOT NULL DEFAULT 0,
    `postscript` VARCHAR(255) NOT NULL DEFAULT '',
    `status` BOOLEAN NOT NULL DEFAULT false,

    INDEX `is_paid`(`status`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`order_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_type` (
    `user_type_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_type_name` VARCHAR(30) NOT NULL DEFAULT '',
    `period` VARCHAR(10) NOT NULL DEFAULT '',
    `original_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `favourable_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 50,
    `is_on` TINYINT UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`user_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_type_account` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL DEFAULT 0,
    `user_type_id` INTEGER NULL DEFAULT 0,
    `amount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `status` BOOLEAN NULL DEFAULT false,
    `pay_time` INTEGER NULL DEFAULT 0,
    `desc` VARCHAR(255) NULL DEFAULT '',
    `add_time` INTEGER NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_withdraw_account` (
    `account_id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `account_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `account_name` VARCHAR(60) NOT NULL DEFAULT '',
    `account_no` TEXT NOT NULL,
    `identity` VARCHAR(60) NOT NULL DEFAULT '',
    `bank_name` VARCHAR(80) NOT NULL DEFAULT '',

    INDEX `card_type`(`account_type`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`account_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_withdraw_apply` (
    `id` MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `add_time` INTEGER NOT NULL DEFAULT 0,
    `finished_time` INTEGER NOT NULL DEFAULT 0,
    `postscript` VARCHAR(255) NOT NULL DEFAULT '',
    `status` BOOLEAN NOT NULL DEFAULT false,
    `account_data` TEXT NOT NULL,

    INDEX `is_paid`(`status`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor` (
    `vendor_id` INTEGER NOT NULL AUTO_INCREMENT,
    `vendor_logo` VARCHAR(255) NULL DEFAULT '',
    `add_time` INTEGER NULL DEFAULT 0,
    `contact_mobile` VARCHAR(255) NULL DEFAULT '',
    `vendor_data` TEXT NULL,
    `person_data` TEXT NULL,
    `status` TINYINT NULL DEFAULT 1,
    `type` BOOLEAN NULL DEFAULT true,
    `vendor_name` VARCHAR(255) NULL DEFAULT '',
    `kefu_phone` VARCHAR(20) NULL DEFAULT '',
    `vendor_money` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `frozen_money` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `description` VARCHAR(255) NULL,
    `last_login_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `service_fee_rate` DECIMAL(10, 2) NULL,
    `fee_rate` DECIMAL(10, 2) NULL,

    PRIMARY KEY (`vendor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_account` (
    `account_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `vendor_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `account_type` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `account_name` VARCHAR(60) NOT NULL DEFAULT '',
    `account_no` TEXT NOT NULL,
    `bank_name` VARCHAR(255) NOT NULL DEFAULT '',
    `add_time` INTEGER NULL DEFAULT 0,
    `bank_branch` VARCHAR(255) NULL DEFAULT '',

    INDEX `account_type`(`account_type`),
    INDEX `vendor_id`(`vendor_id`),
    PRIMARY KEY (`account_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_account_log` (
    `vendor_account_log_id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `add_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `vendor_money` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `frozen_money` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `type` VARCHAR(60) NOT NULL DEFAULT '',
    `remarks` TEXT NULL,
    `new_vendor_money` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `new_frozen_money` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `vendor_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    INDEX `type`(`type`),
    INDEX `vendor_id`(`vendor_id`),
    PRIMARY KEY (`vendor_account_log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_name` VARCHAR(255) NOT NULL,
    `product_brand_id` INTEGER NULL,
    `product_category_id` INTEGER NOT NULL,
    `product_sn_generate_type` TINYINT NOT NULL,
    `product_brief` VARCHAR(255) NULL,
    `product_state` TINYINT NOT NULL,
    `sku_type` TINYINT NOT NULL,
    `product_desc` TEXT NULL,
    `audit_state` TINYINT NOT NULL,
    `pic_url` VARCHAR(255) NULL DEFAULT '',
    `pic_thumb` VARCHAR(255) NULL DEFAULT '',
    `pic_original` VARCHAR(255) NULL DEFAULT '',
    `is_recycle` TINYINT NULL DEFAULT 0,
    `vendor_id` INTEGER NOT NULL,
    `create_time` BIGINT NOT NULL,
    `create_by_id` BIGINT NULL DEFAULT 0,
    `create_by_name` VARCHAR(255) NULL,
    `update_time` BIGINT NOT NULL,
    `update_by_id` BIGINT NULL DEFAULT 0,
    `update_by_name` BIGINT NULL,
    `is_del` TINYINT NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_product_audit_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `vendor_product_id` BIGINT NULL,
    `audit_state` TINYINT NULL,
    `audit_fail_reason` VARCHAR(255) NULL,
    `vendor_id` INTEGER NOT NULL,
    `create_time` BIGINT NOT NULL,
    `create_by_id` BIGINT NULL DEFAULT 0,
    `create_by_name` VARCHAR(255) NULL,
    `update_time` BIGINT NOT NULL,
    `update_by_id` BIGINT NULL DEFAULT 0,
    `update_by_name` VARCHAR(255) NULL,
    `is_del` TINYINT NOT NULL,

    INDEX `vendor_product_audit_log_vendor_product_id_index`(`vendor_product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_product_gallery` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vendor_product_id` INTEGER NOT NULL,
    `pic_url` TEXT NOT NULL,
    `pic_desc` VARCHAR(255) NOT NULL DEFAULT '',
    `pic_thumb` TEXT NOT NULL,
    `pic_original` TEXT NOT NULL,
    `pic_large` TEXT NOT NULL,
    `sort_order` INTEGER NOT NULL,
    `vendor_id` INTEGER NOT NULL,
    `create_time` BIGINT NOT NULL,
    `create_by_id` BIGINT NULL DEFAULT 0,
    `create_by_name` VARCHAR(255) NULL,
    `update_time` BIGINT NOT NULL,
    `update_by_id` BIGINT NULL DEFAULT 0,
    `update_by_name` BIGINT NULL,
    `is_del` TINYINT NULL DEFAULT 0,

    INDEX `vendor_product_gallery_vendor_product_id_index`(`vendor_product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_product_sku` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vendor_product_id` INTEGER NOT NULL,
    `sku_attr_val` VARCHAR(255) NULL DEFAULT '',
    `sku_attr_json` JSON NULL,
    `sku_sn` VARCHAR(60) NULL DEFAULT '',
    `sku_tsn` VARCHAR(120) NULL DEFAULT '',
    `sku_weight` INTEGER NULL,
    `sku_stock` INTEGER NULL,
    `supply_price` DECIMAL(10, 2) NOT NULL,
    `supply_price_limit_type` TINYINT NOT NULL,
    `supply_price_limit_val` DECIMAL(10, 2) NOT NULL,
    `sales_volume` INTEGER NULL DEFAULT 0,
    `vendor_id` INTEGER NOT NULL,
    `create_time` BIGINT NOT NULL,
    `create_by_id` BIGINT NULL DEFAULT 0,
    `create_by_name` VARCHAR(255) NULL,
    `update_time` BIGINT NOT NULL,
    `update_by_id` BIGINT NULL DEFAULT 0,
    `update_by_name` BIGINT NULL,
    `is_del` TINYINT NULL DEFAULT 0,

    INDEX `vendor_product_sku_vendor_product_id_index`(`vendor_product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_product_sku_attr` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `vendor_product_id` INTEGER NOT NULL,
    `attr_type` TINYINT NOT NULL,
    `attr_name` VARCHAR(80) NOT NULL,
    `attr_value` VARCHAR(120) NOT NULL,
    `attr_price` DECIMAL(10, 2) NULL,
    `attr_color` VARCHAR(80) NULL,
    `attr_pic` VARCHAR(255) NULL DEFAULT '',
    `attr_pic_thumb` VARCHAR(255) NULL DEFAULT '',
    `vendor_id` INTEGER NOT NULL,
    `create_time` BIGINT NOT NULL,
    `create_by_id` BIGINT NULL,
    `create_by_name` VARCHAR(255) NULL,
    `update_time` BIGINT NOT NULL,
    `update_by_id` BIGINT NULL,
    `update_by_name` VARCHAR(255) NULL,
    `is_del` TINYINT NULL DEFAULT 0,

    INDEX `vendor_product_sku_attr_vendor_product_id_index`(`vendor_product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_product_sku_stock_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `vendor_product_id` INTEGER NOT NULL,
    `vendor_product_sku_id` INTEGER NOT NULL,
    `operation_type` INTEGER NOT NULL,
    `before_stock` INTEGER NOT NULL,
    `change_num` INTEGER NOT NULL,
    `after_stock` INTEGER NOT NULL,
    `biz_type` SMALLINT NOT NULL,
    `biz_remark` VARCHAR(255) NULL,
    `vendor_id` INTEGER NOT NULL,
    `create_time` BIGINT NOT NULL,
    `create_by_id` BIGINT NULL DEFAULT 0,
    `create_by_name` VARCHAR(255) NULL,
    `update_time` BIGINT NOT NULL,
    `update_by_id` BIGINT NULL DEFAULT 0,
    `update_by_name` VARCHAR(255) NULL,
    `is_del` TINYINT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_product_video` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `vendor_product_id` INTEGER NOT NULL,
    `video_url` VARCHAR(255) NOT NULL,
    `video_cover` VARCHAR(255) NOT NULL,
    `format` VARCHAR(255) NOT NULL,
    `vendor_id` INTEGER NOT NULL,
    `create_time` BIGINT NOT NULL,
    `create_by_id` BIGINT NULL DEFAULT 0,
    `create_by_name` VARCHAR(255) NULL,
    `update_time` BIGINT NOT NULL,
    `update_by_id` BIGINT NULL DEFAULT 0,
    `update_by_name` VARCHAR(255) NULL,
    `is_del` TINYINT NULL DEFAULT 0,

    INDEX `vendor_product_video_vendor_product_id_index`(`vendor_product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_settlement_order` (
    `vendor_settlement_order_id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NULL,
    `shop_id` INTEGER NULL,
    `vendor_id` INTEGER NULL,
    `amount` DECIMAL(10, 2) NULL,
    `add_time` INTEGER NULL,

    PRIMARY KEY (`vendor_settlement_order_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_shop_bind` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vendor_id` INTEGER NOT NULL,
    `shop_id` INTEGER NOT NULL,
    `add_time` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_withdraw` (
    `vendor_withdraw_log_id` INTEGER NOT NULL AUTO_INCREMENT,
    `vendor_id` MEDIUMINT UNSIGNED NOT NULL DEFAULT 0,
    `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `add_time` INTEGER UNSIGNED NOT NULL,
    `remark` TEXT NOT NULL,
    `vendor_account_id` INTEGER NULL,
    `account_data` TEXT NULL,
    `audit_remark` VARCHAR(255) NULL,
    `payment_voucher` TEXT NULL,
    `withdraw_sn` VARCHAR(32) NULL,

    PRIMARY KEY (`vendor_withdraw_log_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wechat_live` (
    `wechat_live_id` INTEGER NOT NULL AUTO_INCREMENT,
    `wechat_live_title` VARCHAR(255) NOT NULL DEFAULT '',
    `wechat_live_data` TEXT NOT NULL,
    `act_range` TINYINT NOT NULL DEFAULT 0,
    `act_range_ext` VARCHAR(255) NOT NULL DEFAULT '',
    `room_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `share_img` VARCHAR(255) NOT NULL DEFAULT '',
    `cover_img` VARCHAR(255) NOT NULL DEFAULT '',
    `anchor_name` VARCHAR(255) NOT NULL DEFAULT '',
    `anchor_img` VARCHAR(255) NOT NULL DEFAULT '',
    `live_status` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `start_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `end_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `last_update_time` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `product_data` TEXT NOT NULL,
    `thumb_img` VARCHAR(255) NOT NULL DEFAULT '',
    `live_sn` VARCHAR(255) NOT NULL DEFAULT '',
    `shop_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,

    PRIMARY KEY (`wechat_live_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
