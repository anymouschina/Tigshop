ALTER TABLE `cart` ADD COLUMN `extra_sku_data` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT '【JSON】附加属性信息[{attr_id,attr_value,attr_name}]' AFTER `salesman_id`;
ALTER TABLE `order_item` ADD COLUMN `extra_sku_data` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL COMMENT '附加属性' AFTER `is_seckill`;
ALTER TABLE `user_company` ADD COLUMN `type` tinyint(1) UNSIGNED NOT NULL DEFAULT 2 COMMENT '认证类型：1 个人 2 企业' AFTER `user_id`;

INSERT INTO `authority` (`authority_id`, `authority_sn`, `authority_name`, `parent_id`, `sort_order`, `is_show`, `child_auth`, `route_link`, `authority_ico`, `is_system`, `admin_type`) VALUES (10000390, 'userCertificationManage', '会员实名认证', 11, 50, 1, '[]', 'user/user_certification/list/', '', 0, 'admin');
INSERT INTO `message_type` (`message_id`, `name`, `describe`, `send_type`, `is_wechat`, `is_mini_program`, `is_message`, `is_msg`, `is_app`, `is_ding`, `add_time`) VALUES (9, '认证通知', '认证通知', 1, -1, -1, -1, 1, -1, -1, -1);
INSERT INTO `message_template` (`id`, `message_id`, `type`, `template_name`, `to_userid`, `template_id`, `template_num`, `content`) VALUES (23, 9, 3, '认证通知', '', 'SMS_475945968', '', '认证通知：您的{$type_text}认证申请已受理,将在{$num}个工作日内完成审核,请耐心等待。');
