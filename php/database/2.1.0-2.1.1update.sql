ALTER TABLE `admin_user` ADD COLUMN `initial_password` varchar(80) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '' COMMENT '初始密码' AFTER `is_using`;
ALTER TABLE `order_item` ADD COLUMN `suppliers_id` int(11) UNSIGNED NOT NULL DEFAULT 0 COMMENT '供应商id' AFTER `extra_sku_data`;
ALTER TABLE `user_points_log` ADD COLUMN `relation_type` tinyint(2) NULL DEFAULT NULL COMMENT '1订单' AFTER `change_type`;
ALTER TABLE `user_points_log` ADD COLUMN `relation_id` int(11) NULL DEFAULT NULL COMMENT '关联id' AFTER `relation_type`;
ALTER TABLE `order_item` ADD COLUMN `suppliers_id` int(11) UNSIGNED NOT NULL DEFAULT 0 COMMENT '供应商id' AFTER `extra_sku_data`;

INSERT INTO `config` (`id`, `code`, `data`) VALUES (47, 'layout_theme_switch', '{\"layout\":\"default\",\"navTheme\":\"dark\",\"primaryColor\":\"blue\",\"uniqueOpened\":false}');
INSERT INTO `message_type` (`message_id`, `name`, `describe`, `send_type`, `is_wechat`, `is_mini_program`, `is_message`, `is_msg`, `is_app`, `is_ding`, `add_time`) VALUES (10, '商家入驻成功', '商家入驻成功', 1, -1, -1, -1, 1, -1, -1, -1);
INSERT INTO `message_type` (`message_id`, `name`, `describe`, `send_type`, `is_wechat`, `is_mini_program`, `is_message`, `is_msg`, `is_app`, `is_ding`, `add_time`) VALUES (11, '商家入驻审核失败', '商家入驻审核失败', 1, -1, -1, -1, 1, -1, -1, -1);
INSERT INTO `message_template` (`id`, `message_id`, `type`, `template_name`, `to_userid`, `template_id`, `template_num`, `content`) VALUES (24, 10, 3, '商家入驻成功', '', 'SMS_476770016', '', '您的商家入驻申请审核成功，请到商户入驻页面查看。登录账号：${username}，初始密码：${password}。');
INSERT INTO `message_template` (`id`, `message_id`, `type`, `template_name`, `to_userid`, `template_id`, `template_num`, `content`) VALUES (25, 11, 3, '商家入驻审核失败', '', 'SMS_476705011', '', '您的商家入驻申请审核失败，请到商家入驻申请页面查看。');

