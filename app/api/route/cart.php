<?php
use think\facade\Route;

// 购物车
Route::group('cart', function () {
    // 购物车
    Route::group('cart', function () {
        // 购物车列表
        Route::get('list', 'list');
        // 获取购物车商品数量
        Route::get('get_count', 'getCount');
        // 更新购物车商品选择状态
        Route::post('update_check', 'updateCheck');
        // 更新购物车商品数量
        Route::post('update_item', 'updateItem');
        // 删除购物车商品
        Route::post('remove_item', 'removeItem');
        // 清空购物车
        Route::post('clear', 'clear');
        // 购物车已选商品优惠计算
        Route::get('get_coupon_discount', 'getCouponDiscount');
    });
})->middleware([
    \app\api\middleware\CheckLogin::class,
])->prefix("cart.cart/");
