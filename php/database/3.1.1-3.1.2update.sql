INSERT INTO `mail_templates` (`template_code`, `is_html`, `template_subject`, `template_content`, `last_modify`, `last_send`, `type`)
VALUES
    ( 'register_code', 1, '登录注册验证码', '验证码：{$code}（邮箱绑定，请完成验证），如非本人操作，请忽略本消息', 1750660659, 0, 'template');

ALTER TABLE `comment` MODIFY `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '评论的内容';

ALTER TABLE `comment` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DELETE FROM authority WHERE authority_sn = 'appVersionManage';
INSERT INTO `authority` (`authority_sn`, `authority_name`, `parent_id`, `sort_order`, `is_show`, `child_auth`, `route_link`, `authority_ico`, `is_system`, `admin_type`) VALUES ('appVersionManage', 'APP版本', 38, 53, 1, '[{\"auth_name\":\"\\u7f16\\u8f91\",\"auth_sn\":\"appVersionUpdateManage\"}]', 'setting/app-version/list', '', 0, 'admin');

DELETE FROM `authority` WHERE `authority_sn` = 'customerTransactionsManage';
INSERT INTO `authority` ( `authority_sn`, `authority_name`, `parent_id`, `sort_order`, `is_show`, `child_auth`, `route_link`, `authority_ico`, `is_system`, `admin_type`)
VALUES
    ( 'customerTransactionsManage', '客户成交', 10000360, 50, 1, '[]', '', '', 0, 'admin');

INSERT INTO `config` (`biz_code`, `biz_val`, `create_time`, `create_by_id`, `create_by_name`, `update_time`, `update_by_id`, `update_by_name`, `is_del`)
VALUES
    ('defaultLogisticsName', '普通快递', 1750040834, 1, 'admin', 1750040834, 1, 'admin', 0);