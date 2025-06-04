ALTER TABLE `refund_apply`
    ADD COLUMN `payment_voucher` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT '打款凭证';