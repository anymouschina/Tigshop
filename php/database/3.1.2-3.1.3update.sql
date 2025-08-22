ALTER TABLE paylog ADD COLUMN `appid` VARCHAR (255) DEFAULT NULL COMMENT '微信支付返回的appid';
INSERT INTO `authority` ( `authority_sn`, `authority_name`, `parent_id`, `sort_order`, `is_show`, `child_auth`, `route_link`, `authority_ico`, `is_system`, `admin_type`)
VALUES
    ('mobileSplashAdManage', '开屏广告', 27, 50, 1, '[]', '', '', 0, 'admin');