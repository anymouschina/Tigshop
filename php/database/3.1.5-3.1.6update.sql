ALTER TABLE `print`
    ADD COLUMN `auto_print` tinyint(1) DEFAULT '2' COMMENT '订单支付自动打印 1开启 2关闭';
INSERT INTO `authority` (`authority_sn`, `authority_name`, `parent_id`, `sort_order`, `is_show`, `child_auth`, `route_link`, `authority_ico`, `is_system`, `admin_type`)
VALUES
    ('shopBaseReceiptManage', '小票打印', 10000311, 50, 1, '[]', '', '', 0, 'shop');
INSERT INTO `authority` (`authority_sn`, `authority_name`, `parent_id`, `sort_order`, `is_show`, `child_auth`, `route_link`, `authority_ico`, `is_system`, `admin_type`)
VALUES
    ('baseReceiptManage', '小票打印', 39, 50, 1, '[]', '', '', 0, 'admin');