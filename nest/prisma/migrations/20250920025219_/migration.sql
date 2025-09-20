-- CreateTable
CREATE TABLE `blacklistedToken` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(512) NOT NULL,
    `userId` INTEGER UNSIGNED NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blacklistedToken_token_key`(`token`),
    INDEX `idx_blacklisted_token_user_id`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passwordResetToken` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(512) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `userId` INTEGER UNSIGNED NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `passwordResetToken_token_key`(`token`),
    INDEX `idx_password_reset_user_id`(`userId`),
    INDEX `idx_password_reset_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emailVerificationToken` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(512) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `userId` INTEGER UNSIGNED NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `emailVerificationToken_token_key`(`token`),
    INDEX `idx_email_verification_user_id`(`userId`),
    INDEX `idx_email_verification_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
