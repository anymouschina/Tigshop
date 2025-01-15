<?php
use think\facade\Route;

// 消息管理组
Route::group('msg', function () {
    // 管理员消息
    Route::group('admin_msg', function () {
        // 列表
        Route::get('list', 'list');
        // 设置单个已读
        Route::post('set_readed', 'setReaded')->append([
			"authorityCheckSubPermissionName" => 'adminMsgModifyManage'
		]);
        // 设置全部已读
        Route::post('set_all_readed', 'setAllReaded')->append([
			"authorityCheckSubPermissionName" => 'adminMsgModifyManage'
		]);

        // 统计
        Route::get('msg_count', 'getMsgCount');
		// 配置项
		Route::get('config', 'config');
    })->prefix("msg.adminMsg/");
});
