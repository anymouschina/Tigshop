<?php
use think\facade\Route;

// 首页
Route::group('home', function () {
    // 首页
    Route::group('home', function () {
        // 首页
        Route::get('index', 'index');
        // PC首页
        Route::get('pc_index', 'pcIndex');
        // 首页今日推荐
        Route::get('get_recommend', 'getRecommend');
        // 首页秒杀
        Route::get('get_seckill', 'getSeckill');
        // 首页优惠券
        Route::get('get_coupon', 'getCoupon');
        // 首页分类栏
        Route::get('mobile_cat_nav', 'mobileCatNav');
        // 移动端导航栏
        Route::get('mobile_nav', 'mobileNav');
        // 个人中心状态
        Route::get('member_decorate', 'memberDecorate');
        // 客服
        Route::get('get_customer_service_config', 'customerServiceConfig');
        // 友情链接
        Route::get('friend_links', 'friendLinks');
    })->prefix("home.home/");
    //装修模板导入
    Route::group('share', function () {
        //装修导入查询
        Route::get('import', 'home.share/import');
    });
});
