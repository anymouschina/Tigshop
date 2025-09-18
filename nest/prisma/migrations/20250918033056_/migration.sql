/*
  Warnings:

  - You are about to drop the column `code` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `expireAt` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Order` table. All the data in the column will be lost.
  - The `status` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `price` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - A unique constraint covering the columns `[couponCode]` on the table `Coupon` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[orderSn]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[mobile]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `couponCode` to the `Coupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `couponName` to the `Coupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `Coupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Coupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalNum` to the `Coupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Coupon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderSn` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productName` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDING', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ShippingStatus" AS ENUM ('UNSHIPPED', 'SHIPPED', 'DELIVERED', 'RETURNED');

-- DropForeignKey
ALTER TABLE "CoupunOrderUser" DROP CONSTRAINT "CoupunOrderUser_couponId_fkey";

-- DropIndex
DROP INDEX "Coupon_code_key";

-- AlterTable
ALTER TABLE "Coupon" DROP COLUMN "code",
DROP COLUMN "discount",
DROP COLUMN "expireAt",
ADD COLUMN     "couponCode" TEXT NOT NULL,
ADD COLUMN     "couponName" TEXT NOT NULL,
ADD COLUMN     "couponType" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "discountAmount" DECIMAL(65,30),
ADD COLUMN     "discountRate" DECIMAL(65,30),
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "isEnable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "minAmount" DECIMAL(65,30),
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "totalNum" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usedNum" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "total",
ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelTime" TIMESTAMP(3),
ADD COLUMN     "completeTime" TIMESTAMP(3),
ADD COLUMN     "discountAmount" DECIMAL(65,30),
ADD COLUMN     "orderSn" TEXT NOT NULL,
ADD COLUMN     "paymentAmount" DECIMAL(65,30),
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentTime" TIMESTAMP(3),
ADD COLUMN     "receiveTime" TIMESTAMP(3),
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "shippingFee" DECIMAL(65,30),
ADD COLUMN     "shippingStatus" "ShippingStatus" NOT NULL DEFAULT 'UNSHIPPED',
ADD COLUMN     "shippingTime" TIMESTAMP(3),
ADD COLUMN     "totalAmount" DECIMAL(65,30),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "discountPrice" DECIMAL(65,30),
ADD COLUMN     "price" DECIMAL(65,30),
ADD COLUMN     "productImage" TEXT,
ADD COLUMN     "productName" TEXT NOT NULL,
ADD COLUMN     "productSpecId" INTEGER,
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "shippingFee" DECIMAL(65,30),
ADD COLUMN     "specValue" TEXT,
ADD COLUMN     "totalPrice" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "brandId" INTEGER,
ADD COLUMN     "categoryId" INTEGER NOT NULL,
ADD COLUMN     "costPrice" DECIMAL(65,30),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "isBest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEnable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isHot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isNew" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRecommend" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "keywords" TEXT,
ADD COLUMN     "marketPrice" DECIMAL(65,30),
ADD COLUMN     "maxBuy" INTEGER,
ADD COLUMN     "minBuy" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "sales" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoKeywords" TEXT,
ADD COLUMN     "seoTitle" TEXT,
ADD COLUMN     "shippingFee" DECIMAL(65,30),
ADD COLUMN     "shopId" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "sort" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "specType" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "supplierId" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "video" TEXT,
ADD COLUMN     "videoCover" TEXT,
ADD COLUMN     "volume" DECIMAL(65,30),
ADD COLUMN     "weight" DECIMAL(65,30),
ALTER COLUMN "price" DROP NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "stock" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "balance" DECIMAL(65,30),
ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEnable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLoginIp" TEXT,
ADD COLUMN     "lastLoginTime" TIMESTAMP(3),
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "registerTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "totalAmount" DECIMAL(65,30),
ADD COLUMN     "userRankId" INTEGER,
ALTER COLUMN "name" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CouponCode" (
    "couponId" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "discount" DECIMAL(65,30),
    "expireAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponCode_pkey" PRIMARY KEY ("couponId")
);

-- CreateTable
CREATE TABLE "UserRank" (
    "userRankId" SERIAL NOT NULL,
    "rankName" TEXT NOT NULL,
    "minPoints" INTEGER NOT NULL,
    "maxPoints" INTEGER,
    "discount" DECIMAL(65,30),
    "description" TEXT,
    "icon" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isEnable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserRank_pkey" PRIMARY KEY ("userRankId")
);

-- CreateTable
CREATE TABLE "Category" (
    "categoryId" SERIAL NOT NULL,
    "parentId" INTEGER,
    "categoryName" TEXT NOT NULL,
    "categoryImage" TEXT,
    "keywords" TEXT,
    "description" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isShow" BOOLEAN NOT NULL DEFAULT true,
    "isNav" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("categoryId")
);

-- CreateTable
CREATE TABLE "Brand" (
    "brandId" SERIAL NOT NULL,
    "brandName" TEXT NOT NULL,
    "brandLogo" TEXT,
    "brandImage" TEXT,
    "keywords" TEXT,
    "description" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isShow" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("brandId")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "supplierId" SERIAL NOT NULL,
    "supplierName" TEXT NOT NULL,
    "contact" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "address" TEXT,
    "description" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isEnable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("supplierId")
);

-- CreateTable
CREATE TABLE "Shop" (
    "shopId" SERIAL NOT NULL,
    "shopName" TEXT NOT NULL,
    "shopLogo" TEXT,
    "shopImage" TEXT,
    "keywords" TEXT,
    "description" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "address" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isEnable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("shopId")
);

-- CreateTable
CREATE TABLE "ProductSpec" (
    "specId" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "specName" TEXT NOT NULL,
    "specValue" TEXT NOT NULL,
    "specPrice" DECIMAL(65,30),
    "specStock" INTEGER NOT NULL DEFAULT 0,
    "specSku" TEXT,
    "specImage" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSpec_pkey" PRIMARY KEY ("specId")
);

-- CreateTable
CREATE TABLE "ProductAttr" (
    "attrId" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "attrName" TEXT NOT NULL,
    "attrValue" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAttr_pkey" PRIMARY KEY ("attrId")
);

-- CreateTable
CREATE TABLE "OrderAddress" (
    "addressId" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderAddress_pkey" PRIMARY KEY ("addressId")
);

-- CreateTable
CREATE TABLE "UserCoupon" (
    "userCouponId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "couponId" INTEGER NOT NULL,
    "orderId" INTEGER,
    "status" INTEGER NOT NULL DEFAULT 0,
    "usedTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCoupon_pkey" PRIMARY KEY ("userCouponId")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "adminId" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "mobile" TEXT,
    "avatar" TEXT,
    "adminType" TEXT NOT NULL DEFAULT 'admin',
    "isEnable" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginTime" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("adminId")
);

-- CreateTable
CREATE TABLE "AdminRole" (
    "roleId" SERIAL NOT NULL,
    "roleName" TEXT NOT NULL,
    "roleDesc" TEXT,
    "authorityList" JSONB NOT NULL,
    "adminType" TEXT NOT NULL DEFAULT 'admin',
    "isEnable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminRole_pkey" PRIMARY KEY ("roleId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "notificationId" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "relatedData" JSONB,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "result" JSONB,
    "error" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("notificationId")
);

-- CreateTable
CREATE TABLE "File" (
    "fileId" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "relatedId" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("fileId")
);

-- CreateIndex
CREATE UNIQUE INDEX "CouponCode_code_key" ON "CouponCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_couponCode_key" ON "Coupon"("couponCode");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderSn_key" ON "Order"("orderSn");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_userRankId_fkey" FOREIGN KEY ("userRankId") REFERENCES "UserRank"("userRankId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("brandId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("supplierId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("shopId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupunOrderUser" ADD CONSTRAINT "CoupunOrderUser_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "CouponCode"("couponId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("categoryId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSpec" ADD CONSTRAINT "ProductSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttr" ADD CONSTRAINT "ProductAttr_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAddress" ADD CONSTRAINT "OrderAddress_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("couponId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
