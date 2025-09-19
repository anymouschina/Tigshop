/*
  Warnings:

  - The primary key for the `AdminRole` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `adminType` on the `AdminRole` table. All the data in the column will be lost.
  - You are about to drop the column `authorityList` on the `AdminRole` table. All the data in the column will be lost.
  - You are about to drop the column `isEnable` on the `AdminRole` table. All the data in the column will be lost.
  - You are about to drop the column `roleDesc` on the `AdminRole` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `AdminRole` table. All the data in the column will be lost.
  - You are about to drop the column `roleName` on the `AdminRole` table. All the data in the column will be lost.
  - The primary key for the `AdminUser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `adminId` on the `AdminUser` table. All the data in the column will be lost.
  - You are about to drop the column `adminType` on the `AdminUser` table. All the data in the column will be lost.
  - You are about to drop the column `isEnable` on the `AdminUser` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginIp` on the `AdminUser` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginTime` on the `AdminUser` table. All the data in the column will be lost.
  - The primary key for the `Brand` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `brandId` on the `Brand` table. All the data in the column will be lost.
  - You are about to drop the column `brandImage` on the `Brand` table. All the data in the column will be lost.
  - You are about to drop the column `brandLogo` on the `Brand` table. All the data in the column will be lost.
  - You are about to drop the column `brandName` on the `Brand` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Brand` table. All the data in the column will be lost.
  - You are about to drop the column `isShow` on the `Brand` table. All the data in the column will be lost.
  - You are about to drop the column `keywords` on the `Brand` table. All the data in the column will be lost.
  - You are about to drop the column `sort` on the `Brand` table. All the data in the column will be lost.
  - The primary key for the `Cart` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cartId` on the `Cart` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Cart` table. All the data in the column will be lost.
  - The primary key for the `Category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `categoryId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `categoryImage` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `categoryName` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `isNav` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `isShow` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `sort` on the `Category` table. All the data in the column will be lost.
  - The primary key for the `Coupon` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `couponCode` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `couponId` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `couponName` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `couponType` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `discountAmount` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `discountRate` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `isEnable` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `minAmount` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `totalNum` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `usedNum` on the `Coupon` table. All the data in the column will be lost.
  - The primary key for the `Order` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `appointmentId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `appointmentInfo` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `cancelReason` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `cancelTime` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `completeTime` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `discountAmount` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `orderSn` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `paymentAmount` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatus` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `paymentTime` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `receiveTime` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `remark` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingFee` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingStatus` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `shippingTime` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Order` table. All the data in the column will be lost.
  - The primary key for the `OrderItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `discountPrice` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `orderItemId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `productImage` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `productName` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `productSpecId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `remark` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `shippingFee` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `specValue` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `OrderItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - The primary key for the `Product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `brandId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `costPrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `images` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isBest` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isEnable` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isHot` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isNew` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `isRecommend` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `marketPrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `maxBuy` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `minBuy` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `sales` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `seoDescription` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `seoKeywords` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `seoTitle` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `shippingFee` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `sort` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `specType` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stock` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `subtitle` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `video` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `videoCover` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `volume` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `Product` table. All the data in the column will be lost.
  - The primary key for the `Shop` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `address` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `isEnable` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `keywords` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `mobile` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `shopId` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `shopImage` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `shopLogo` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `shopName` on the `Shop` table. All the data in the column will be lost.
  - You are about to drop the column `sort` on the `Shop` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `address` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `avatarUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isEnable` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginIp` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastLoginTime` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `openId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `province` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `ref` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `registerTime` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `unionId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userRankId` on the `User` table. All the data in the column will be lost.
  - You are about to alter the column `balance` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - The primary key for the `UserCoupon` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `couponId` on the `UserCoupon` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `UserCoupon` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `UserCoupon` table. All the data in the column will be lost.
  - You are about to drop the column `usedTime` on the `UserCoupon` table. All the data in the column will be lost.
  - You are about to drop the column `userCouponId` on the `UserCoupon` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `UserCoupon` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `blacklisted_token` table. All the data in the column will be lost.
  - You are about to drop the `Appointment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BlacklistedToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CartItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CouponCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CoupunOrderUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrderAddress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductAttr` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductSpec` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReferralCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Supplier` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserRank` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserReferral` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[order_sn]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `role_id` to the `AdminUser` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `AdminUser` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mobile` on table `AdminUser` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `product_id` to the `Cart` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Cart` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Cart` table without a default value. This is not possible if the table is not empty.
  - Made the column `keywords` on table `Category` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `region_ids` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region_names` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `order_id` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sku_data` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `price` on table `OrderItem` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `category_id` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Made the column `keywords` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `Shop` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `balance` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `mobile` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nickname` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `coupon_id` to the `UserCoupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UserCoupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `UserCoupon` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_userId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_cartId_fkey";

-- DropForeignKey
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_parentId_fkey";

-- DropForeignKey
ALTER TABLE "CoupunOrderUser" DROP CONSTRAINT "CoupunOrderUser_couponId_fkey";

-- DropForeignKey
ALTER TABLE "CoupunOrderUser" DROP CONSTRAINT "CoupunOrderUser_orderId_fkey";

-- DropForeignKey
ALTER TABLE "CoupunOrderUser" DROP CONSTRAINT "CoupunOrderUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- DropForeignKey
ALTER TABLE "OrderAddress" DROP CONSTRAINT "OrderAddress_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_brandId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_shopId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "ProductAttr" DROP CONSTRAINT "ProductAttr_productId_fkey";

-- DropForeignKey
ALTER TABLE "ProductSpec" DROP CONSTRAINT "ProductSpec_productId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_userRankId_fkey";

-- DropForeignKey
ALTER TABLE "UserCoupon" DROP CONSTRAINT "UserCoupon_couponId_fkey";

-- DropForeignKey
ALTER TABLE "UserCoupon" DROP CONSTRAINT "UserCoupon_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserReferral" DROP CONSTRAINT "UserReferral_referralCodeId_fkey";

-- DropForeignKey
ALTER TABLE "UserReferral" DROP CONSTRAINT "UserReferral_referrerOpenId_fkey";

-- DropForeignKey
ALTER TABLE "UserReferral" DROP CONSTRAINT "UserReferral_userId_fkey";

-- DropForeignKey
ALTER TABLE "blacklisted_token" DROP CONSTRAINT "blacklisted_token_user_id_fkey";

-- DropIndex
DROP INDEX "AdminUser_username_key";

-- DropIndex
DROP INDEX "Cart_userId_key";

-- DropIndex
DROP INDEX "Coupon_couponCode_key";

-- DropIndex
DROP INDEX "Order_orderSn_key";

-- DropIndex
DROP INDEX "User_openId_key";

-- DropIndex
DROP INDEX "User_unionId_key";

-- AlterTable
ALTER TABLE "AdminRole" DROP CONSTRAINT "AdminRole_pkey",
DROP COLUMN "adminType",
DROP COLUMN "authorityList",
DROP COLUMN "isEnable",
DROP COLUMN "roleDesc",
DROP COLUMN "roleId",
DROP COLUMN "roleName",
ADD COLUMN     "admin_type" TEXT NOT NULL DEFAULT 'admin',
ADD COLUMN     "authority_list" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "merchant_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "role_desc" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "role_id" SERIAL NOT NULL,
ADD COLUMN     "role_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "shop_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vendor_id" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("role_id");

-- AlterTable
ALTER TABLE "AdminUser" DROP CONSTRAINT "AdminUser_pkey",
DROP COLUMN "adminId",
DROP COLUMN "adminType",
DROP COLUMN "isEnable",
DROP COLUMN "lastLoginIp",
DROP COLUMN "lastLoginTime",
ADD COLUMN     "add_time" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "admin_id" SERIAL NOT NULL,
ADD COLUMN     "admin_type" TEXT NOT NULL DEFAULT 'admin',
ADD COLUMN     "auth_list" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "extra" TEXT,
ADD COLUMN     "initial_password" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "is_using" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "menu_tag" TEXT,
ADD COLUMN     "merchant_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "order_export" TEXT,
ADD COLUMN     "parent_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "role_id" INTEGER NOT NULL,
ADD COLUMN     "shop_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "suppliers_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "user_id" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "username" SET DEFAULT '',
ALTER COLUMN "password" SET DEFAULT '',
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "email" SET DEFAULT '',
ALTER COLUMN "mobile" SET NOT NULL,
ALTER COLUMN "mobile" SET DEFAULT '',
ADD CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("admin_id");

-- AlterTable
ALTER TABLE "Brand" DROP CONSTRAINT "Brand_pkey",
DROP COLUMN "brandId",
DROP COLUMN "brandImage",
DROP COLUMN "brandLogo",
DROP COLUMN "brandName",
DROP COLUMN "description",
DROP COLUMN "isShow",
DROP COLUMN "keywords",
DROP COLUMN "sort",
ADD COLUMN     "brand_desc" TEXT,
ADD COLUMN     "brand_en_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "brand_id" SERIAL NOT NULL,
ADD COLUMN     "brand_is_hot" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "brand_logo" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "brand_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "brand_type" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "check_status" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "first_word" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "is_show" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "is_store_brand" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reject_remark" TEXT,
ADD COLUMN     "shop_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "site_url" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "Brand_pkey" PRIMARY KEY ("brand_id");

-- AlterTable
ALTER TABLE "Cart" DROP CONSTRAINT "Cart_pkey",
DROP COLUMN "cartId",
DROP COLUMN "userId",
ADD COLUMN     "cart_id" SERIAL NOT NULL,
ADD COLUMN     "extra_sku_data" TEXT,
ADD COLUMN     "is_checked" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "market_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "original_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "pic_thumb" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "product_id" INTEGER NOT NULL,
ADD COLUMN     "product_sn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "product_type" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "salesman_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shop_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sku_data" TEXT,
ADD COLUMN     "sku_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "update_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "Cart_pkey" PRIMARY KEY ("cart_id");

-- AlterTable
ALTER TABLE "Category" DROP CONSTRAINT "Category_pkey",
DROP COLUMN "categoryId",
DROP COLUMN "categoryImage",
DROP COLUMN "categoryName",
DROP COLUMN "description",
DROP COLUMN "isNav",
DROP COLUMN "isShow",
DROP COLUMN "parentId",
DROP COLUMN "sort",
ADD COLUMN     "category_desc" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "category_ico" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "category_id" SERIAL NOT NULL,
ADD COLUMN     "category_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "category_pic" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "is_hot" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_show" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "measure_unit" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "parent_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "search_keywords" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "seo_title" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "short_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 50,
ALTER COLUMN "keywords" SET NOT NULL,
ALTER COLUMN "keywords" SET DEFAULT '',
ADD CONSTRAINT "Category_pkey" PRIMARY KEY ("category_id");

-- AlterTable
ALTER TABLE "Coupon" DROP CONSTRAINT "Coupon_pkey",
DROP COLUMN "couponCode",
DROP COLUMN "couponId",
DROP COLUMN "couponName",
DROP COLUMN "couponType",
DROP COLUMN "discountAmount",
DROP COLUMN "discountRate",
DROP COLUMN "endTime",
DROP COLUMN "isEnable",
DROP COLUMN "minAmount",
DROP COLUMN "startTime",
DROP COLUMN "totalNum",
DROP COLUMN "usedNum",
ADD COLUMN     "add_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "coupon_desc" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "coupon_discount" DECIMAL(4,1) NOT NULL DEFAULT 10.0,
ADD COLUMN     "coupon_id" SERIAL NOT NULL,
ADD COLUMN     "coupon_money" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "coupon_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "coupon_type" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "coupon_unit" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "delay_day" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "enabled_click_get" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_delete" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_global" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_new_user" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_show" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "limit_num" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "limit_user_rank" TEXT,
ADD COLUMN     "max_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "min_order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "reduce_type" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "send_end_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "send_num" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "send_range" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "send_range_data" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "send_start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "send_type" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shop_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "use_day" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "use_end_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "use_start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "Coupon_pkey" PRIMARY KEY ("coupon_id");

-- AlterTable
ALTER TABLE "Order" DROP CONSTRAINT "Order_pkey",
DROP COLUMN "appointmentId",
DROP COLUMN "appointmentInfo",
DROP COLUMN "cancelReason",
DROP COLUMN "cancelTime",
DROP COLUMN "completeTime",
DROP COLUMN "discountAmount",
DROP COLUMN "orderId",
DROP COLUMN "orderSn",
DROP COLUMN "paymentAmount",
DROP COLUMN "paymentMethod",
DROP COLUMN "paymentStatus",
DROP COLUMN "paymentTime",
DROP COLUMN "receiveTime",
DROP COLUMN "remark",
DROP COLUMN "shippingFee",
DROP COLUMN "shippingStatus",
DROP COLUMN "shippingTime",
DROP COLUMN "status",
DROP COLUMN "totalAmount",
DROP COLUMN "userId",
ADD COLUMN     "add_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "address" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "address_data" TEXT,
ADD COLUMN     "admin_note" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "balance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "buyer_note" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "comment_status" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "consignee" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "coupon_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "distribution_status" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "email" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "invoice_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "is_del" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_need_commisson" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_store_splited" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "logistics_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "logistics_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "mobile" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "offline_paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "online_paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "order_id" SERIAL NOT NULL,
ADD COLUMN     "order_sn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "order_status" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "parent_order_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "parent_order_sn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "pay_status" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pay_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "pay_type_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "points_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "product_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "received_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "referrer_user_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "region_ids" TEXT NOT NULL,
ADD COLUMN     "region_names" TEXT NOT NULL,
ADD COLUMN     "service_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "shipping_fee" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "shipping_method" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "shipping_status" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shipping_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "shipping_type_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shipping_type_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "shop_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "tracking_no" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "unpaid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "unrefund_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "use_points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "Order_pkey" PRIMARY KEY ("order_id");

-- AlterTable
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_pkey",
DROP COLUMN "discountPrice",
DROP COLUMN "orderId",
DROP COLUMN "orderItemId",
DROP COLUMN "productId",
DROP COLUMN "productImage",
DROP COLUMN "productName",
DROP COLUMN "productSpecId",
DROP COLUMN "remark",
DROP COLUMN "shippingFee",
DROP COLUMN "specValue",
DROP COLUMN "totalPrice",
ADD COLUMN     "card_group_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "commission" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "delivery_quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "extra_sku_data" TEXT,
ADD COLUMN     "is_gift" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_pin" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_seckill" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "item_id" SERIAL NOT NULL,
ADD COLUMN     "order_id" INTEGER NOT NULL,
ADD COLUMN     "order_sn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "origin_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "pic_thumb" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "prepay_price" DECIMAL(8,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "product_id" INTEGER NOT NULL,
ADD COLUMN     "product_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "product_sn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "product_type" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "promotion_data" TEXT,
ADD COLUMN     "shop_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sku_data" TEXT NOT NULL,
ADD COLUMN     "sku_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "suppliers_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD COLUMN     "vendor_id" INTEGER,
ADD COLUMN     "vendor_product_id" INTEGER,
ADD COLUMN     "vendor_product_sku_id" INTEGER,
ALTER COLUMN "quantity" SET DEFAULT 1,
ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "price" SET DEFAULT 0.00,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2),
ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("item_id");

-- AlterTable
ALTER TABLE "Product" DROP CONSTRAINT "Product_pkey",
DROP COLUMN "brandId",
DROP COLUMN "categoryId",
DROP COLUMN "costPrice",
DROP COLUMN "deletedAt",
DROP COLUMN "description",
DROP COLUMN "image",
DROP COLUMN "images",
DROP COLUMN "isBest",
DROP COLUMN "isDeleted",
DROP COLUMN "isEnable",
DROP COLUMN "isHot",
DROP COLUMN "isNew",
DROP COLUMN "isRecommend",
DROP COLUMN "marketPrice",
DROP COLUMN "maxBuy",
DROP COLUMN "minBuy",
DROP COLUMN "name",
DROP COLUMN "price",
DROP COLUMN "productId",
DROP COLUMN "sales",
DROP COLUMN "seoDescription",
DROP COLUMN "seoKeywords",
DROP COLUMN "seoTitle",
DROP COLUMN "shippingFee",
DROP COLUMN "shopId",
DROP COLUMN "sort",
DROP COLUMN "specType",
DROP COLUMN "stock",
DROP COLUMN "subtitle",
DROP COLUMN "supplierId",
DROP COLUMN "video",
DROP COLUMN "videoCover",
DROP COLUMN "volume",
DROP COLUMN "weight",
ADD COLUMN     "add_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "brand_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "category_id" INTEGER NOT NULL,
ADD COLUMN     "check_reason" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "check_status" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "click_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "comment_tag" TEXT,
ADD COLUMN     "free_shipping" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "give_integral" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "integral" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_best" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_delete" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_hot" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_new" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_promote" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_promote_activity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_update" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "limit_number" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "market_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "pic_original" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "pic_thumb" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "pic_url" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "product_brief" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "product_care" TEXT,
ADD COLUMN     "product_desc" TEXT,
ADD COLUMN     "product_id" SERIAL NOT NULL,
ADD COLUMN     "product_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "product_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "product_related" TEXT,
ADD COLUMN     "product_service_ids" TEXT,
ADD COLUMN     "product_sn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "product_status" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "product_stock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "product_tsn" TEXT,
ADD COLUMN     "product_type" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "product_weight" DECIMAL(10,3) NOT NULL DEFAULT 0.000,
ADD COLUMN     "promote_end_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "promote_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "promote_start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "rank_integral" INTEGER NOT NULL DEFAULT -1,
ADD COLUMN     "remark" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "seckill_max_num" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shipping_tpl_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shop_category_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shop_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "store_sort_order" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "suppliers_id" INTEGER,
ADD COLUMN     "virtual_sales" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "keywords" SET NOT NULL,
ALTER COLUMN "keywords" SET DEFAULT '',
ADD CONSTRAINT "Product_pkey" PRIMARY KEY ("product_id");

-- AlterTable
ALTER TABLE "Shop" DROP CONSTRAINT "Shop_pkey",
DROP COLUMN "address",
DROP COLUMN "email",
DROP COLUMN "isEnable",
DROP COLUMN "keywords",
DROP COLUMN "mobile",
DROP COLUMN "shopId",
DROP COLUMN "shopImage",
DROP COLUMN "shopLogo",
DROP COLUMN "shopName",
DROP COLUMN "sort",
ADD COLUMN     "add_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "click_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "contact_mobile" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "fee_rate" DECIMAL(10,2),
ADD COLUMN     "frozen_money" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "is_contact_kefu" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "kefu_inlet" TEXT,
ADD COLUMN     "kefu_link" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "kefu_phone" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "kefu_weixin" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "last_login_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "merchant_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "service_fee_rate" DECIMAL(10,2),
ADD COLUMN     "shop_id" SERIAL NOT NULL,
ADD COLUMN     "shop_logo" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "shop_money" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "shop_title" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "vendor_set_price_auto_value" DECIMAL(10,2),
ADD COLUMN     "vendor_set_price_type" INTEGER NOT NULL DEFAULT 3,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "description" SET DEFAULT '',
ADD CONSTRAINT "Shop_pkey" PRIMARY KEY ("shop_id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "address",
DROP COLUMN "avatarUrl",
DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "gender",
DROP COLUMN "isDeleted",
DROP COLUMN "isEnable",
DROP COLUMN "language",
DROP COLUMN "lastLoginIp",
DROP COLUMN "lastLoginTime",
DROP COLUMN "name",
DROP COLUMN "openId",
DROP COLUMN "province",
DROP COLUMN "ref",
DROP COLUMN "registerTime",
DROP COLUMN "totalAmount",
DROP COLUMN "unionId",
DROP COLUMN "userId",
DROP COLUMN "userRankId",
ADD COLUMN     "address_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "avatar" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "distribution_register_time" TIMESTAMP(3),
ADD COLUMN     "email_validated" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "from_tag" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "frozen_balance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "growth_points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "history_product_ids" TEXT,
ADD COLUMN     "is_company_auth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_distribution" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_svip" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_ip" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "last_login" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "mobile_validated" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "order_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "order_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rank_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referrer_user_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reg_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "svip_expire_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" SERIAL NOT NULL,
ADD COLUMN     "username" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "wechat_img" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "email" SET DEFAULT '',
ALTER COLUMN "password" SET NOT NULL,
ALTER COLUMN "password" SET DEFAULT '',
ALTER COLUMN "balance" SET NOT NULL,
ALTER COLUMN "balance" SET DEFAULT 0.00,
ALTER COLUMN "balance" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "mobile" SET NOT NULL,
ALTER COLUMN "mobile" SET DEFAULT '',
ALTER COLUMN "nickname" SET NOT NULL,
ALTER COLUMN "nickname" SET DEFAULT '',
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("user_id");

-- AlterTable
ALTER TABLE "UserCoupon" DROP CONSTRAINT "UserCoupon_pkey",
DROP COLUMN "couponId",
DROP COLUMN "orderId",
DROP COLUMN "status",
DROP COLUMN "usedTime",
DROP COLUMN "userCouponId",
DROP COLUMN "userId",
ADD COLUMN     "coupon_id" INTEGER NOT NULL,
ADD COLUMN     "coupon_sn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "end_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "order_id" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "used_time" TIMESTAMP(3),
ADD COLUMN     "user_id" INTEGER NOT NULL,
ADD CONSTRAINT "UserCoupon_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "blacklisted_token" DROP COLUMN "created_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "Appointment";

-- DropTable
DROP TABLE "BlacklistedToken";

-- DropTable
DROP TABLE "CartItem";

-- DropTable
DROP TABLE "CouponCode";

-- DropTable
DROP TABLE "CoupunOrderUser";

-- DropTable
DROP TABLE "File";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "OrderAddress";

-- DropTable
DROP TABLE "ProductAttr";

-- DropTable
DROP TABLE "ProductSpec";

-- DropTable
DROP TABLE "ReferralCode";

-- DropTable
DROP TABLE "Supplier";

-- DropTable
DROP TABLE "UserRank";

-- DropTable
DROP TABLE "UserReferral";

-- DropEnum
DROP TYPE "AppointmentStatus";

-- DropEnum
DROP TYPE "OrderStatus";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "ShippingStatus";

-- DropEnum
DROP TYPE "Status";

-- CreateTable
CREATE TABLE "UserAddress" (
    "address_id" SERIAL NOT NULL,
    "address_tag" TEXT NOT NULL DEFAULT '',
    "user_id" INTEGER NOT NULL,
    "consignee" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "region_ids" TEXT NOT NULL,
    "region_names" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "postcode" TEXT NOT NULL DEFAULT '',
    "telephone" TEXT NOT NULL DEFAULT '',
    "mobile" TEXT NOT NULL DEFAULT '',
    "is_default" INTEGER NOT NULL DEFAULT 0,
    "is_selected" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAddress_pkey" PRIMARY KEY ("address_id")
);

-- CreateTable
CREATE TABLE "ProductSku" (
    "sku_id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "sku_value" TEXT NOT NULL DEFAULT '',
    "sku_data" TEXT,
    "sku_sn" TEXT NOT NULL DEFAULT '',
    "sku_stock" INTEGER NOT NULL DEFAULT 0,
    "sku_tsn" TEXT NOT NULL DEFAULT '',
    "sku_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "sku_promote_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "sku_market_price" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "sku_pic" TEXT NOT NULL DEFAULT '',
    "sku_pic_thumb" TEXT NOT NULL DEFAULT '',
    "sku_weight" DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    "sku_volume" DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    "sku_code" TEXT NOT NULL DEFAULT '',
    "supplier_id" INTEGER NOT NULL DEFAULT 0,
    "supplier_sku_id" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSku_pkey" PRIMARY KEY ("sku_id")
);

-- CreateTable
CREATE TABLE "ProductAttribute" (
    "attributes_id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "attr_type" INTEGER NOT NULL DEFAULT 0,
    "attr_name" TEXT NOT NULL DEFAULT '',
    "attr_value" TEXT NOT NULL DEFAULT '',
    "attr_price" DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    "attr_color" TEXT NOT NULL DEFAULT '',
    "attr_pic" TEXT NOT NULL DEFAULT '',
    "attr_pic_thumb" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("attributes_id")
);

-- CreateTable
CREATE TABLE "ProductGallery" (
    "pic_id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "pic_url" TEXT NOT NULL DEFAULT '',
    "pic_desc" TEXT NOT NULL DEFAULT '',
    "pic_thumb" TEXT NOT NULL DEFAULT '',
    "pic_original" TEXT NOT NULL DEFAULT '',
    "pic_large" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductGallery_pkey" PRIMARY KEY ("pic_id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "paylog_id" SERIAL NOT NULL,
    "pay_sn" TEXT NOT NULL DEFAULT '',
    "pay_name" TEXT NOT NULL DEFAULT '',
    "order_id" INTEGER NOT NULL,
    "order_sn" TEXT NOT NULL DEFAULT '',
    "order_amount" DECIMAL(10,2) NOT NULL,
    "order_type" INTEGER NOT NULL DEFAULT 0,
    "pay_amount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "pay_status" INTEGER NOT NULL DEFAULT 0,
    "pay_code" TEXT NOT NULL DEFAULT '',
    "add_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transaction_id" TEXT NOT NULL DEFAULT '',
    "notify_data" TEXT NOT NULL DEFAULT '',
    "refund_amount" DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    "token_code" TEXT NOT NULL DEFAULT '',
    "appid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("paylog_id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "comment_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL DEFAULT '',
    "avatar" TEXT NOT NULL DEFAULT '',
    "product_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL DEFAULT 0,
    "order_item_id" INTEGER NOT NULL DEFAULT 0,
    "comment_rank" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT NOT NULL DEFAULT '',
    "add_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" INTEGER NOT NULL DEFAULT 0,
    "parent_id" INTEGER NOT NULL DEFAULT 0,
    "usefull" INTEGER NOT NULL DEFAULT 0,
    "useless" INTEGER NOT NULL DEFAULT 0,
    "comment_tag" TEXT,
    "show_pics" TEXT,
    "is_recommend" INTEGER NOT NULL DEFAULT 0,
    "is_top" INTEGER NOT NULL DEFAULT 0,
    "is_showed" INTEGER NOT NULL DEFAULT 0,
    "is_default" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 50,
    "shop_id" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "CollectProduct" (
    "collect_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "add_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectProduct_pkey" PRIMARY KEY ("collect_id")
);

-- CreateTable
CREATE TABLE "CollectShop" (
    "collect_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "add_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectShop_pkey" PRIMARY KEY ("collect_id")
);

-- CreateTable
CREATE TABLE "article" (
    "article_id" SERIAL NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "image" TEXT,
    "category_id" INTEGER NOT NULL DEFAULT 0,
    "author" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL DEFAULT '',
    "keywords" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "click_count" INTEGER NOT NULL DEFAULT 0,
    "is_show" INTEGER NOT NULL DEFAULT 1,
    "sort_order" INTEGER NOT NULL DEFAULT 100,
    "add_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_pkey" PRIMARY KEY ("article_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_pay_sn_key" ON "Payment"("pay_sn");

-- CreateIndex
CREATE UNIQUE INDEX "CollectProduct_user_id_product_id_key" ON "CollectProduct"("user_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "CollectShop_user_id_shop_id_key" ON "CollectShop"("user_id", "shop_id");

-- CreateIndex
CREATE UNIQUE INDEX "Order_order_sn_key" ON "Order"("order_sn");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "AdminRole"("role_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAddress" ADD CONSTRAINT "UserAddress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "Brand"("brand_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("shop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSku" ADD CONSTRAINT "ProductSku_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductGallery" ADD CONSTRAINT "ProductGallery_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Category"("category_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "ProductSku"("sku_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("shop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "ProductSku"("sku_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("shop_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("order_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "Coupon"("coupon_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("order_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Comment"("comment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectProduct" ADD CONSTRAINT "CollectProduct_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectProduct" ADD CONSTRAINT "CollectProduct_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("product_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectShop" ADD CONSTRAINT "CollectShop_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectShop" ADD CONSTRAINT "CollectShop_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "Shop"("shop_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blacklisted_token" ADD CONSTRAINT "blacklisted_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
