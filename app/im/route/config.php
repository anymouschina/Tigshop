<?php

use think\facade\Route;

// 配置项
Route::group('config', function () {
    // 配置
    Route::group('config', function () {
        // 详情
        Route::get('detail', 'detail');
        // 保存配置
        Route::post('save', 'save');

    })->prefix("config.config/");

});