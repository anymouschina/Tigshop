<?php
use think\facade\Route;

// 商品分类
Route::group('category', function () {
    // 商品分类
    Route::group('category', function () {
        // 获取当前分类的父级分类
        Route::get('parent_tree', 'parentTree');
        // 获取所有分类
        Route::get('all', 'all');
        // 获取指定分类
        Route::get('list', 'list');
        // 商品相关分类
        Route::get('relate_info', 'relateInfo');
        // 商品相关分类
        Route::get('relate_category', 'getRelateCategory');
        // 商品相关品牌
        Route::get('relate_brand', 'getRelateBrand');
        // 商品相关排行
        Route::get('relate_rank', 'getRelateRank');
        // 商品相关文章
        Route::get('relate_article', 'getRelateArticle');
        // 商品相关排行
        Route::get('relate_look_also', 'getRelateLookAlso');
        // 热门分类
        Route::get('hot', 'hot');
    })->prefix("category.category/");
});
