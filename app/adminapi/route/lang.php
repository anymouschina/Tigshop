<?php
use think\facade\Route;

// 多语言路由
Route::group('lang', function () {
    // 地区语言
    Route::group('locales', function () {
        // 列表
        Route::get('list', 'list');
        // 新增
        Route::post('create', 'create')->append([
            "authorityCheckSubPermissionName" => 'localesModifyManage'
        ]);
        // 编辑
        Route::post('update', 'update')->append([
            "authorityCheckSubPermissionName" => 'localesModifyManage'
        ]);
        // 详情
        Route::get('detail', 'detail');
        // 删除
        Route::post('del', 'del')->append([
            "authorityCheckSubPermissionName" => 'localesModifyManage'
        ]);
        // 更新字段
        Route::post('update_field', 'updateField')->append([
            "authorityCheckSubPermissionName" => 'localesModifyManage'
        ]);
        // batch批量操作
        Route::post('batch', 'batch');
    })->prefix('lang.locales/');

    // 默认语言匹配
    Route::group('locales_relation', function () {
        // 列表
        Route::get('list', 'list');
        // 新增
        Route::post('create', 'create')->append([
			"authorityCheckSubPermissionName" => 'localesRelationModifyManage'
		]);
        // config
        Route::get('config', 'config');
        // 编辑
        Route::post('update', 'update')->append([
			"authorityCheckSubPermissionName" => 'localesRelationModifyManage'
		]);
        // 详情
        Route::get('detail', 'detail');
        // 删除
        Route::post('del', 'del')->append([
			"authorityCheckSubPermissionName" => 'localesRelationModifyManage'
		]);
        // batch批量操作
        Route::post('batch', 'batch')->append([
			"authorityCheckSubPermissionName" => 'localesRelationModifyManage'
		]);
    })->prefix('lang.localesRelation/');

    // 翻译内容
    Route::group('translations', function () {
        // 列表
        Route::get('list', 'list');
        // 新增
        Route::post('create', 'create')->append([
			"authorityCheckSubPermissionName" => 'translationsModifyManage'
		]);
        // 新增
        Route::post('batch_create', 'batchCreate')->append([
            "authorityCheckSubPermissionName" => 'translationsModifyManage'
        ]);
        // 翻译
        Route::post('translation', 'translation')->append([
			"authorityCheckSubPermissionName" => 'translationsModifyManage'
		]);
        // 翻译
        Route::post('create_translations', 'createTranslations')->append([
			"authorityCheckSubPermissionName" => 'translationsModifyManage'
		]);
        // 获得翻译
        Route::get('get_translations', 'getTranslations');
        // config
        Route::get('config', 'config');
        // 编辑
        Route::post('update', 'update')->append([
			"authorityCheckSubPermissionName" => 'translationsModifyManage'
		]);
        // 详情
        Route::get('detail', 'detail');
        // 删除
        Route::post('del', 'del')->append([
			"authorityCheckSubPermissionName" => 'translationsModifyManage'
		]);
        // batch批量操作
        Route::post('batch', 'batch')->append([
			"authorityCheckSubPermissionName" => 'translationsModifyManage'
		]);
		// 一键更新
		Route::post('multiple', 'multipleTranslation')->append([
			"authorityCheckSubPermissionName" => 'translationsModifyManage'
		]);
    })->prefix('lang.translations/');

    // 币种管理
    Route::group('currency', function () {
        // 列表
        Route::get('list', 'list');
        // 配置项
        Route::get('config', 'config');
        // 新增
        Route::post('create', 'create')->append([
			"authorityCheckSubPermissionName" => 'currencyModifyManage'
		]);
        // 编辑
        Route::post('update', 'update')->append([
			"authorityCheckSubPermissionName" => 'currencyModifyManage'
		]);
        // 详情
        Route::get('detail', 'detail');
        // 删除
        Route::post('del', 'del')->append([
			"authorityCheckSubPermissionName" => 'currencyModifyManage'
		]);
        // 更新字段
        Route::post('update_field', 'updateField')->append([
			"authorityCheckSubPermissionName" => 'currencyModifyManage'
		]);
        // batch批量操作
        Route::post('batch', 'batch')->append([
			"authorityCheckSubPermissionName" => 'currencyModifyManage'
		]);
    })->prefix('lang.currency/');
})->middleware([
    \app\adminapi\middleware\CheckAuthor::class
]);
