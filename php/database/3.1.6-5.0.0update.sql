ALTER TABLE `decorate`
    ADD COLUMN `locale_id` int NULL DEFAULT 0 COMMENT '关联语言默认为0' AFTER `update_time`,
ADD COLUMN `parent_id` int NULL DEFAULT 0 COMMENT '父级id' AFTER `locale_id`;

DELETE FROM authority WHERE authority_sn = 'mobileuserUserOverseasManage';
INSERT INTO `authority` (`authority_sn`, `authority_name`, `parent_id`, `sort_order`, `is_show`, `child_auth`, `route_link`, `authority_ico`, `is_system`, `admin_type`)
VALUES
    ('mobileuserUserOverseasManage', '会员首页', 27, 50, 1, '[]', '', '', 0, 'admin');

DELETE FROM authority WHERE authority_sn = 'mobileUserManage';

INSERT INTO `authority` ( `authority_sn`, `authority_name`, `parent_id`, `sort_order`, `is_show`, `child_auth`, `route_link`, `authority_ico`, `is_system`, `admin_type`)
VALUES
    ( 'mobileUserManage', '会员首页', 27, 53, 1, '[]', 'decorate/mobile_decorate/user', '', 0, 'admin');