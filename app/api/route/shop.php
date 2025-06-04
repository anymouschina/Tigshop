<?php

use think\facade\Route;

// 店铺
Route::group('shop', function () {
    // 店铺
    Route::group('shop', function () {
        // 装修
        Route::get('decorate', 'decorate');
        // 详情
        Route::get('detail', 'detail');
        // 分类
        Route::get('category', 'category');
        // 获取当前分类的父级分类
        Route::get('parentTree', 'parentTree');
        // 收藏
        Route::post('collect', 'collect')->middleware([
            \app\api\middleware\CheckLogin::class
        ]);
        // 店铺头部装修
        Route::get('head', 'shopHead');
		// 店铺列表
		Route::get('list', 'list');
        //装修导入查询
        Route::get('import', 'import');

    })->prefix("shop.shop/")->middleware([

    ]);
    // 店铺
    Route::group('category', function () {
        // 分类
        Route::get('tree', 'tree');
        // 获取当前分类的父级分类
        Route::get('parentTree', 'parentTree');


    })->prefix("shop.category/")->middleware([

    ]);
});