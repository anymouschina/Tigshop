<?php
use think\facade\Route;

// 订单
Route::group('order', function () {

    // 订单结算
    Route::group('check', function () {
        // 结算
        Route::post('index', 'index');
        // 订单
        Route::post('update', 'update');
        // 订单
        Route::post('update_coupon', 'updateCoupon');
        // 订单提交
        Route::post('submit', 'submit');
        // 获得上次订单发票信息
        Route::get('get_invoice', 'getInvoice');

    })->middleware([
        \app\api\middleware\CheckLogin::class,
    ])->prefix("order.check/");

    // 订单支付
    Route::group('pay', function () {
        // 支付页信息
        Route::get('index', 'index');
        // 订单状态
        Route::get('check_status', 'checkStatus');
        // 支付
        Route::get('create', 'create');
        // 支付回调
        Route::post('notify', 'notify');
        // 退款回调
        Route::post('refund_notify', 'refundNotify');
    })->prefix("order.pay/");
});
