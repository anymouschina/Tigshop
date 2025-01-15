<?php

use think\facade\Route;

Route::group('product', function () {

    //兑换
    Route::group('exchange', function () {
        // 列表
        Route::get('list', 'list');
        // 详情
        Route::get('detail', 'detail');
        // 详情
        Route::post('add_to_cart', 'addToCart');

    })->prefix("product.exchange/");

    // 商品
    Route::group('product', function () {
        // 详情
        Route::get('detail', 'detail');
        // 评论
        Route::get('get_comment', 'getComment');
        // 评论列表
        Route::get('get_comment_list', 'getCommentList');
        // 咨询列表
        Route::get('get_feedback_list', 'getFeedbackList');
        // 可用信息sku和活动等
        Route::get('get_product_availability', 'getProductAvailability');

        Route::post('get_product_amount', 'getProductAmount');
        Route::get('get_product_amount', 'getProductAmount');
        // 列表
        Route::get('list', 'list');
        // 优惠卷
        Route::get('get_coupon', 'getCouponList');
        // 是否收藏
        Route::get('is_collect', 'isCollect');
        //加入购物车
        Route::post('add_to_cart', 'addToCart')->middleware([
            \app\api\middleware\CheckLogin::class,
        ]);
        // 优惠信息
        Route::post('promotion', 'getProductsPromotion');
        // 是否收藏
        Route::get('get_related', 'getProductRelated');
        // 商品询价
        Route::post('price_inquiry', 'priceInquiry');
    })->prefix("product.product/");
});
