<?php

use think\facade\Route;

// 会话
Route::group('conversation', function () {
    // 会话
    Route::group('conversation', function () {
        // 列表
        Route::get('list', 'list');
        // 列表
        Route::get('search', 'search')->middleware([
            \app\im\middleware\CheckServantLogin::class,
        ]);
        // 转接
        Route::post('transfer', 'transfer')->middleware([
            \app\im\middleware\CheckServantLogin::class,
        ]);
        // 创建
        Route::post('create', 'create')->middleware([
            \app\im\middleware\CheckServantLogin::class,
        ]);
        Route::get('waitServantList', 'WaitServantList')->middleware([
            \app\im\middleware\CheckServantLogin::class,
        ]);
        Route::post('del', 'del')->middleware([
            \app\im\middleware\CheckServantLogin::class,
        ]);

        // 历史会话
        Route::get('consultHistory', 'consultHistory');
        // 保存会话备注/总结
        Route::post('saveRemark', 'saveRemark')->middleware([
            \app\im\middleware\CheckServantLogin::class,
        ]);

        // 保存会话备注/总结
        Route::get('detail', 'detail');

    })->prefix("conversation.conversation/");
    // 消息
    Route::group('message', function () {
        // 列表
        Route::get('list', 'list');
        // 发送消息
        Route::post('send', 'send');
        // 消息已读
        Route::post('setRead', 'setRead');
    })->prefix("conversation.message/");
});