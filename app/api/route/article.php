<?php
use think\facade\Route;

// 文章
Route::group('article', function () {
    // 文章
    Route::group('article', function () {
        // 文章列表
        Route::get('list', 'list');
        // 资讯类文章详情
        Route::get('news_info', 'newsInfo');
        // 帮助类文章详情
        Route::get('issue_info', 'issueInfo');
    })->prefix("article.article/");
    // 文章分类
    Route::group('category', function () {
        // 文章分类
        Route::get('list', 'list');
        // 首页帮助分类与文章
        Route::get('index_bzzx_list', 'indexBzzxList');
    })->prefix("article.category/");
});