/*
  Warnings:

  - A unique constraint covering the columns `[shop_id,pickup_day,pickup_no]` on the table `order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `order` ADD COLUMN `pickup_day` INTEGER UNSIGNED NULL,
    ADD COLUMN `pickup_no` MEDIUMINT UNSIGNED NULL,
    ADD COLUMN `table_no` VARCHAR(32) NULL;

-- CreateTable
CREATE TABLE `shop_table` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `shop_id` MEDIUMINT UNSIGNED NOT NULL,
    `table_no` VARCHAR(32) NOT NULL,
    `qr_code_key` VARCHAR(64) NULL,
    `status` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `capacity` SMALLINT UNSIGNED NULL,
    `area` VARCHAR(32) NULL,
    `sort` INTEGER NULL DEFAULT 0,
    `add_time` INTEGER UNSIGNED NULL DEFAULT 0,
    `update_time` INTEGER UNSIGNED NULL DEFAULT 0,

    INDEX `idx_shop_table_shop`(`shop_id`),
    UNIQUE INDEX `uniq_shop_table_no`(`shop_id`, `table_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `upload` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` TEXT NOT NULL,
    `file_url` TEXT NOT NULL,
    `file_size` INTEGER UNSIGNED NOT NULL,
    `file_type` VARCHAR(100) NOT NULL,
    `category` VARCHAR(50) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `related_id` INTEGER UNSIGNED NULL,
    `description` TEXT NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `user_id` INTEGER UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    INDEX `upload_user_id`(`user_id`),
    INDEX `upload_type`(`type`),
    INDEX `upload_category`(`category`),
    INDEX `upload_related_id`(`related_id`),
    INDEX `upload_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `idx_order_shop_table_no` ON `order`(`shop_id`, `table_no`);

-- CreateIndex
CREATE INDEX `idx_order_shop_pickup_queue` ON `order`(`shop_id`, `pickup_day`, `pickup_no`);

-- CreateIndex
CREATE UNIQUE INDEX `uniq_shop_day_pickup_no` ON `order`(`shop_id`, `pickup_day`, `pickup_no`);
