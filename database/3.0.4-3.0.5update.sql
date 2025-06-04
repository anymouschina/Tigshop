ALTER TABLE `gallery_video_info` ADD COLUMN video_cover VARCHAR(100) NOT NULL DEFAULT '' COMMENT '视频封面';
ALTER TABLE `gallery_video_info` ADD COLUMN format VARCHAR(20) NOT NULL DEFAULT '' COMMENT '视频类型';
ALTER TABLE `gallery_video_info` ADD COLUMN video_first_frame VARCHAR(255) NOT NULL DEFAULT '' COMMENT '视频第一帧封面';
ALTER TABLE `gallery_video_info` ADD COLUMN duration VARCHAR(100) NOT NULL DEFAULT '' COMMENT '时长';
ALTER TABLE `gallery_video_info` ADD COLUMN size VARCHAR(50) NOT NULL DEFAULT '' COMMENT '大小';

DROP TABLE IF EXISTS `product_video`;

CREATE TABLE `product_video` (
    `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
    `video_id` mediumint(8) unsigned NOT NULL COMMENT '商品视频ID',
    `product_id` mediumint(8) unsigned NOT NULL DEFAULT '0' COMMENT '商品id ',
    `video_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '视频url ',
     `video_cover` varchar(255) NOT NULL DEFAULT '' COMMENT '视频封面',
     `format` varchar(100) NOT NULL DEFAULT '' COMMENT '视频第一帧封面',
     PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COMMENT='产品视频关联表';