<?php

use think\facade\Route;

// 会话
Route::group('servant', function () {
    // 会话
    Route::group('servant', function () {
        // 转接的客服列表
        Route::get('transfer_list', 'transferList')->middleware([
            \app\im\middleware\CheckServantLogin::class,
        ]);
        Route::post('modify_status', 'modifyStatus')->middleware([
            \app\im\middleware\CheckServantLogin::class,
        ]);
    })->prefix("servant.servant/");

});