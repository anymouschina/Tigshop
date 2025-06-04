<?php

use think\facade\Route;

// 配置组
Route::group('setting', function () {
    // APP版本管理
    Route::group('appVersion', function () {
        // 详情
        Route::get('detail', 'detail');
        // 添加
        Route::post('create', 'create')->append([
            "authorityCheckSubPermissionName" => 'appVersionUpdateManage'
        ]);
        // 编辑
        Route::post('update', 'update')->append([
            "authorityCheckSubPermissionName" => 'appVersionUpdateManage'
        ]);
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendName' => 'appVersionManage'
    ])->prefix('setting.appVersion/')->middleware([
        \app\adminapi\middleware\CheckAuthor::class
    ]);

    // 授权管理
    Route::group('licensed', function () {
        // 详情
        Route::get('index', 'index');
        // 添加
        Route::post('update', 'update')->append([
            "authorityCheckSubPermissionName" => 'licensedModifyManage'
        ]);

        Route::post('saveLicensed', 'saveLicensed');

    })->append([
        //用于权限校验的名称
        'authorityCheckAppendName' => 'licensed'
    ])->prefix('setting.licensed/');
// 前端后台设置项
    Route::get('config/getAdmin', 'setting.config/getAdmin');
    // 设置项管理
    Route::group('config', function () {
        // 基础设置
        Route::get('getBase', 'getBase');
        // 商城基础配置
        Route::get('basicConfig', 'basicConfig')->append([
            'authorityCheckSubPermissionName' => 'config'
        ]);
        // 商城基础配置
        Route::get('basicSettings', 'basicSettings')->append([
            'authorityCheckSubPermissionName' => 'config'
        ]);
        // 获取商品配置
        Route::get('productSettings', 'productSettings')->append([
            'authorityCheckSubPermissionName' => 'config'
        ]);
        // 获取购物配置
        Route::get('shoppingSettings', 'shoppingSettings')->append([
            'authorityCheckSubPermissionName' => 'config'
        ]);
        // 保存商品配置
        Route::post('saveProduct', 'saveProduct')->append([
            'authorityCheckSubPermissionName' => 'saveBasicManage'
        ]);
        // 保存购物配置
        Route::post('saveShopping', 'saveShopping')->append([
            'authorityCheckSubPermissionName' => 'saveBasicManage'
        ]);
        // 获取通知配置
        Route::get('notifySettings', 'notifySettings')->append([
            'authorityCheckSubPermissionName' => 'config'
        ]);
        // 保存通知配置
        Route::post('saveNotify', 'saveNotify')->append([
            'authorityCheckSubPermissionName' => 'saveBasicManage'
        ]);
        // 获取显示配置
        Route::get('showSettings', 'showSettings')->append([
            'authorityCheckSubPermissionName' => 'config'
        ]);
        // 保存显示配置
        Route::post('saveShow', 'saveShow')->append([
            'authorityCheckSubPermissionName' => 'saveBasicManage'
        ]);
        // 获取客服配置
        Route::get('kefuSettings', 'kefuSettings')->append([
            'authorityCheckSubPermissionName' => 'config'
        ]);
        // 保存客服配置
        Route::post('saveKefu', 'saveKefu')->append([
            'authorityCheckSubPermissionName' => 'saveBasicManage'
        ]);
        // 获取接口配置
        Route::get('apiSettings', 'apiSettings')->append([
            'authorityCheckSubPermissionName' => 'config'
        ]);
        // 保存接口配置
        Route::post('saveApi', 'saveApi')->append([
            'authorityCheckSubPermissionName' => 'saveBasicManage'
        ]);
        // 获取会员认证配置
        Route::get('authSettings', 'authSettings')->append([
            'authorityCheckSubPermissionName' => 'config'
        ]);
        // 保存会员认证配置
        Route::post('saveAuth', 'saveAuth')->append([
            'authorityCheckSubPermissionName' => 'saveBasicManage'
        ]);
        // 获取主题风格配置
        Route::get('themeStyleSettings', 'themeStyleSettings')->append([
            'authorityCheckSubPermissionName' => 'config'
        ]);
        // 保存主题风格配置
        Route::post('saveThemeStyle', 'saveThemeStyle')->append([
            'authorityCheckSubPermissionName' => 'saveBasicManage'
        ]);
        // 获取分类页装修配置
        Route::get('categoryDecorateSettings', 'categoryDecorateSettings')->append([
            'authorityCheckSubPermissionName' => 'saveBasicManage'
        ]);
        // 保存分类页装修配置
        Route::post('saveCategoryDecorate', 'saveCategoryDecorate')->append([
            'authorityCheckSubPermissionName' => 'saveBasicManage'
        ]);
        // 获取邮箱配置
        Route::get('mailSettings', 'mailSettings')->append([
            'authorityCheckSubPermissionName' => 'config'
        ]);

        // 获取物流配置
        Route::get('shippingSettings', 'shippingSettings')->append([
            'authorityCheckSubPermissionName' => 'config'
        ]);

        // 获取支付配置
        Route::get('afterSalesSettings', 'afterSalesSettings')->append([
            'authorityCheckSubPermissionName' => 'config'
        ]);

        // 获取售后配置
        Route::get('paySettings', 'paySettings')->append([
            'authorityCheckSubPermissionName' => 'config'
        ]);

        // 保存商城基础配置
        Route::post('saveBasic', 'saveBasic')->append([
            "authorityCheckSubPermissionName" => 'saveBasicManage'
        ]);

        //保存售后设置
        Route::post('saveAfterSales', 'saveAfterSales')->append([
            "authorityCheckSubPermissionName" => 'settingSaveAfterSalesManage'
        ]);
        //保存支付设置
        Route::post('savePay', 'savePay')->append([
            "authorityCheckSubPermissionName" => 'settingSavePayManage'
        ]);
        //保存物流设置
        Route::post('saveShipping', 'saveShipping')->append([
            "authorityCheckSubPermissionName" => 'settingSaveShippingManage'
        ]);
        // 邮箱服务器设置
        Route::post('saveMail', 'saveMail')->append([
            "authorityCheckSubPermissionName" => 'settingSaveMailManage'
        ]);
        // 获取图标icon
        Route::get('getIcon', 'getIcon');
        // 发送测试邮件
        Route::post('sendTestEmail', 'sendTestEmail')->append([
			"authorityCheckSubPermissionName" => 'sendTestEmailModifyManage'
		]);
        // 上传API文件
        Route::post('uploadFile', 'uploadFile')->append([
			"authorityCheckSubPermissionName" => 'uploadFileModifyManage'
		]);
        // 生成平台证书
        Route::post('createPlatformCertificate', 'createPlatformCertificate')->append([
			"authorityCheckSubPermissionName" => 'platformCertificateModifyManage'
		]);

        // 获取主题切换配置
        Route::get('layoutThemeSwitchSettings', 'layoutThemeSwitchSettings')->append([
            'authorityCheckSubPermissionName' => 'config'
        ]);

        //获取商户配置
        Route::get('merchantSettings', 'merchantSettings')->append([
            'authorityCheckSubPermissionName' => 'config'
        ]);

        //保存商户配置
        Route::post('saveMerchant', 'saveMerchant')->append([
            'authorityCheckSubPermissionName' => 'saveBasicManage'
        ]);

        //获取店铺配置
        Route::get('shopSettings', 'shopSettings')->append([
            'authorityCheckSubPermissionName' => 'config'
        ]);

        //保存店铺配置
        Route::post('saveShop', 'saveShop')->append([
            'authorityCheckSubPermissionName' => 'saveBasicManage'
        ]);

    })->append([
        //用于权限校验的名称
        'authorityCheckAppendName' => 'config'
    ])->prefix('setting.config/')->middleware([
        \app\adminapi\middleware\CheckAuthor::class
    ]);

    // 计划任务
//    Route::group('crons', function () {
//        // 列表
//        Route::get('list', 'list');
//        // 详情
//        Route::get('detail', 'detail');
//        // 添加
//        Route::post('create', 'create');
//        // 编辑
//        Route::post('update', 'update');
//        // 更新单个字段
//        Route::post('updateField', 'updateField');
//        // 删除
//        Route::post('del', 'del');
//        // 批量操作
//        Route::post('batch', 'batch');
//    })->append([
//        //用于权限校验的名称
//        'authorityCheckAppendName' => 'cronsManage'
//    ])->prefix('setting.crons/');

    // 友情链接
    Route::group('friendLinks', function () {
        // 列表
        Route::get('list', 'list');
        // 详情
        Route::get('detail', 'detail');
        // 添加
        Route::post('create', 'create')->append([
            "authorityCheckSubPermissionName" => 'friendLinksUpdateManage'
        ]);
        // 编辑
        Route::post('update', 'update')->append([
            "authorityCheckSubPermissionName" => 'friendLinksUpdateManage'
        ]);
        // 更新单个字段
        Route::post('updateField', 'updateField')->append([
            "authorityCheckSubPermissionName" => 'friendLinksUpdateManage'
        ]);
        // 删除
        Route::post('del', 'del')->append([
            "authorityCheckSubPermissionName" => 'friendLinksDelManage'
        ]);
        // 批量操作
        Route::post('batch', 'batch')->append([
            "authorityCheckSubPermissionName" => 'friendLinksBatchManage'
        ]);
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendName' => 'friendLinksManage'
    ])->prefix('setting.friendLinks/')->middleware([
        \app\adminapi\middleware\CheckAuthor::class
    ]);

    // 相册
    Route::group('gallery', function () {
        // 列表
        Route::get('list', 'list');
        // 详情
        Route::get('detail', 'detail');
        // 添加
        Route::post('create', 'create')->append([
			"authorityCheckSubPermissionName" => 'galleryModifyManage'
		]);
        // 编辑
        Route::post('update', 'update')->append([
			"authorityCheckSubPermissionName" => 'galleryModifyManage'
		]);
		// 更新单个字段
		Route::post('updateField', 'updateField')->append([
			"authorityCheckSubPermissionName" => 'galleryModifyManage'
		]);
        // 删除
        Route::post('del', 'del')->append([
			"authorityCheckSubPermissionName" => 'galleryModifyManage'
		]);
        // 批量操作
        Route::post('batch', 'batch')->append([
			"authorityCheckSubPermissionName" => 'galleryModifyManage'
		]);
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendName' => 'galleryManage'
    ])->prefix('setting.gallery/')->middleware([
        \app\adminapi\middleware\CheckAuthor::class
    ]);

    //视频相册
    Route::group('galleryVideo', function () {
        // 列表
        Route::get('list', 'list');
        // 详情
        Route::get('detail', 'detail');
        // 添加
        Route::post('create', 'create')->append([
            "authorityCheckSubPermissionName" => 'galleryVideoManage'
        ]);
        // 编辑
        Route::post('update', 'update')->append([
            "authorityCheckSubPermissionName" => 'galleryVideoManage'
        ]);
        // 更新单个字段
        Route::post('updateField', 'updateField')->append([
            "authorityCheckSubPermissionName" => 'galleryVideoManage'
        ]);
        // 删除
        Route::post('del', 'del')->append([
            "authorityCheckSubPermissionName" => 'galleryVideoManage'
        ]);
        // 批量操作
        Route::post('batch', 'batch')->append([
            "authorityCheckSubPermissionName" => 'galleryVideoManage'
        ]);
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendName' => 'galleryVideoManage'
    ])->prefix('setting.galleryVideo/')->middleware([
        \app\adminapi\middleware\CheckAuthor::class
    ]);

    //视频信息
    Route::group('galleryVideoInfo', function () {
        // 列表
        Route::get('list', 'list');
        // 详情
        Route::get('detail', 'detail');
        // 添加
        Route::post('create', 'create')->append([
            "authorityCheckSubPermissionName" => 'galleryVideoManage'
        ]);
        // 编辑
        Route::post('update', 'update')->append([
            "authorityCheckSubPermissionName" => 'galleryVideoManage'
        ]);
        // 更新单个字段
        Route::post('updateField', 'updateField')->append([
            "authorityCheckSubPermissionName" => 'galleryVideoManage'
        ]);
        // 图片上传
        Route::post('uploadVideo', 'uploadVideo')->append([
            "authorityCheckSubPermissionName" => 'galleryVideoManage'
        ]);
        // 删除
        Route::post('del', 'del')->append([
            "authorityCheckSubPermissionName" => 'galleryVideoManage'
        ]);
        // 批量操作
        Route::post('batch', 'batch')->append([
            "authorityCheckSubPermissionName" => 'galleryVideoManage'
        ]);
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendName' => 'galleryVideoManage'
    ])->prefix('setting.galleryVideoInfo/')->middleware([
        \app\adminapi\middleware\CheckAuthor::class
    ]);

    // 相册图片
    Route::group('galleryPic', function () {
        // 列表
        Route::get('list', 'list');
        // 详情
        Route::get('detail', 'detail');
        // 添加
        Route::post('create', 'create')->append([
			"authorityCheckSubPermissionName" => 'galleryPicModifyManage'
		]);
        // 编辑
        Route::post('update', 'update')->append([
			"authorityCheckSubPermissionName" => 'galleryPicModifyManage'
		]);
        // 更新单个字段
        Route::post('updateField', 'updateField')->append([
			"authorityCheckSubPermissionName" => 'galleryPicModifyManage'
		]);
        // 图片上传
        Route::post('uploadImg', 'uploadImg')->append([
			"authorityCheckSubPermissionName" => 'galleryPicModifyManage'
		]);
        // 删除
        Route::post('del', 'del')->append([
			"authorityCheckSubPermissionName" => 'galleryPicModifyManage'
		]);
        // 批量操作
        Route::post('batch', 'batch')->append([
			"authorityCheckSubPermissionName" => 'galleryPicModifyManage'
		]);
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendName' => 'galleryPicManage'
    ])->prefix('setting.galleryPic/')->middleware([
        \app\adminapi\middleware\CheckAuthor::class
    ]);

    // 物流公司
    Route::group('logisticsCompany', function () {
        // 分页列表
        Route::get('list', 'list');
        // 全部列表
        Route::get('getAll', 'getAll');
        // 详情
        Route::get('detail', 'detail');
        // 添加
        Route::post('create', 'create')->append([
            "authorityCheckSubPermissionName" => 'logisticsCompanyUpdateManage'
        ]);
        // 编辑
        Route::post('update', 'update')->append([
            "authorityCheckSubPermissionName" => 'logisticsCompanyUpdateManage'
        ]);
        // 更新单个字段
        Route::post('updateField', 'updateField')->append([
            "authorityCheckSubPermissionName" => 'logisticsCompanyUpdateManage'
        ]);
        // 删除
        Route::post('del', 'del')->append([
            "authorityCheckSubPermissionName" => 'logisticsCompanyDelManage'
        ]);
        // 批量操作
        Route::post('batch', 'batch')->append([
            "authorityCheckSubPermissionName" => 'logisticsCompanyBatchManage'
        ]);
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendName' => 'logisticsCompanyManage'
    ])->prefix('setting.logisticsCompany/')->middleware([
        \app\adminapi\middleware\CheckAuthor::class
    ]);

    // 邮件模板设置
    Route::group('mailTemplates', function () {
        // 列表
        Route::get('list', 'list');
        // 编辑
        Route::post('update', 'update')->append([
            "authorityCheckSubPermissionName" => 'mailTemplatesUpdateManage'
        ]);
        // 获取所有的邮件模板
        Route::get('getAllMailTemplates', 'getAllMailTemplates');
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendGroupName' => 'mailTemplateManage'
    ])->prefix('setting.mailTemplates/')->middleware([
        \app\adminapi\middleware\CheckAuthor::class
    ]);

    // 消息设置
    Route::group('messageType', function () {
        // 列表
        Route::get('list', 'list');
        // 详情
        Route::get('detail', 'detail');
        // 添加
        Route::post('create', 'create')->append([
            "authorityCheckSubPermissionName" => 'messageTypeUpdateManage'
        ]);
        // 编辑
        Route::post('update', 'update')->append([
            "authorityCheckSubPermissionName" => 'messageTypeUpdateManage'
        ]);
        // 更新单个字段
        Route::post('updateField', 'updateField')->append([
            "authorityCheckSubPermissionName" => 'messageTypeUpdateManage'
        ]);
        // 删除
        Route::post('del', 'del')->append([
            "authorityCheckSubPermissionName" => 'messageTypeDelManage'
        ]);
        // 批量操作
        Route::post('batch', 'batch')->append([
            "authorityCheckSubPermissionName" => 'messageTypeBatchManage'
        ]);
        // 生成小程序消息模板
        Route::post('miniProgramMessageTemplate', 'miniProgramMessageTemplate')->append([
            "authorityCheckSubPermissionName" => 'miniProgramMessageTemplateManage'
        ]);
        // 同步小程序消息模板
        Route::post('miniProgramMessageTemplateSync', 'miniProgramMessageTemplateSync')->append([
            "authorityCheckSubPermissionName" => 'miniProgramMessageTemplateSyncManage'
        ]);
        // 生成公众号消息模板
        Route::post('wechatMessageTemplate', 'wechatMessageTemplate')->append([
            "authorityCheckSubPermissionName" => 'wechatMessageTemplateManage'
        ]);
        // 同步公众号消息模板
        Route::post('wechatMessageTemplateSync', 'wechatMessageTemplateSync')->append([
            "authorityCheckSubPermissionName" => 'wechatMessageTemplateSyncManage'
        ]);
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendGroupName' => 'messageTypeManage'
    ])->prefix('setting.messageType/')->middleware([
        \app\adminapi\middleware\CheckAuthor::class
    ]);

    // 地区管理
    Route::group('region', function () {
        // 列表
        Route::get('list', 'list');
        // 详情
        Route::get('detail', 'detail');
        // 获取地区树
        Route::get('getRegionTree', 'getRegionTree');
        // 获取所有地区树
        Route::get('getAllRegionTree', 'getAllRegionTree');
        // 获取子地区
        Route::get('getChildRegion', 'getChildRegion');
        // 添加
        Route::post('create', 'create')->append([
            "authorityCheckSubPermissionName" => 'regionUpdateManage'
        ]);
        // 编辑
        Route::post('update', 'update')->append([
            "authorityCheckSubPermissionName" => 'regionUpdateManage'
        ]);
        // 更新单个字段
        Route::post('updateField', 'updateField')->append([
            "authorityCheckSubPermissionName" => 'regionUpdateManage'
        ]);
        // 删除
        Route::post('del', 'del')->append([
            "authorityCheckSubPermissionName" => 'regionDelManage'
        ]);
        // 批量操作
        Route::post('batch', 'batch')->append([
            "authorityCheckSubPermissionName" => 'regionBatchManage'
        ]);
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendGroupName' => 'regionManage'
    ])->prefix('setting.region/')->middleware([
        \app\adminapi\middleware\CheckAuthor::class
    ]);

    // 运费模板管理
    Route::group('shippingTpl', function () {
        // 列表
        Route::get('list', 'list');
        // 配置型
        Route::get('config', 'config');
        // 详情
        Route::get('detail', 'detail');
        // 添加
        Route::post('create', 'create')->append([
            "authorityCheckSubPermissionName" => 'shippingTplUpdateManage'
        ]);
        // 编辑
        Route::post('update', 'update')->append([
            "authorityCheckSubPermissionName" => 'shippingTplUpdateManage'
        ]);
        // 更新单个字段
        Route::post('updateField', 'updateField')->append([
            "authorityCheckSubPermissionName" => 'shippingTplUpdateManage'
        ]);
        // 删除
        Route::post('del', 'del')->append([
            "authorityCheckSubPermissionName" => 'shippingTplDelManage'
        ]);
        // 批量操作
        Route::post('batch', 'batch')->append([
            "authorityCheckSubPermissionName" => 'shippingTplBatchManage'
        ]);
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendGroupName' => 'shippingTplManage'
    ])->prefix('setting.shippingTpl/')->middleware([
        \app\adminapi\middleware\CheckAuthor::class
    ]);

    // 配送类型
    Route::group('shippingType', function () {
        // 列表
        Route::get('list', 'list');
        // 详情
        Route::get('detail', 'detail');
        // 添加
        Route::post('create', 'create')->append([
            "authorityCheckSubPermissionName" => 'shippingTypeUpdateManage'
        ]);
        // 编辑
        Route::post('update', 'update')->append([
            "authorityCheckSubPermissionName" => 'shippingTypeUpdateManage'
        ]);
        // 更新单个字段
        Route::post('updateField', 'updateField')->append([
            "authorityCheckSubPermissionName" => 'shippingTypeUpdateManage'
        ]);
        // 删除
        Route::post('del', 'del')->append([
            "authorityCheckSubPermissionName" => 'shippingTypeDelManage'
        ]);
        // 批量操作
        Route::post('batch', 'batch')->append([
            "authorityCheckSubPermissionName" => 'shippingTypeBatchManage'
        ]);
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendGroupName' => 'shippingTypeManage'
    ])->prefix('setting.shippingType/')->middleware([
        \app\adminapi\middleware\CheckAuthor::class
    ]);

	// 内置相册
	Route::group('album', function () {
		// 列表
		Route::get('list', 'list');
		// 更新单个字段
		Route::post('updateField', 'updateField')->append([
			"authorityCheckSubPermissionName" => 'albumModifyManage'
		]);
		// 删除
		Route::post('del', 'del')->append([
			"authorityCheckSubPermissionName" => 'albumModifyManage'
		]);
		// 批量操作
		Route::post('batch', 'batch')->append([
			"authorityCheckSubPermissionName" => 'albumModifyManage'
		]);
	})->append([
		//用于权限校验的名称
		'authorityCheckAppendName' => 'albumManage'
    ])->prefix('setting.album/')->middleware([
        \app\adminapi\middleware\CheckAuthor::class
    ]);

	// 区号维护
	Route::group('areaCode', function () {
		// 列表
		Route::get('list', 'list');
		// 详情
		Route::get('detail', 'detail');
		// 添加
		Route::post('create', 'create')->append([
			"authorityCheckSubPermissionName" => 'areaCodeModifyManage'
		]);
		// 编辑
		Route::post('update', 'update')->append([
			"authorityCheckSubPermissionName" => 'areaCodeModifyManage'
		]);
		// 更新单个字段
		Route::post('updateField', 'updateField')->append([
			"authorityCheckSubPermissionName" => 'areaCodeModifyManage'
		]);
		// 删除
		Route::post('del', 'del')->append([
			"authorityCheckSubPermissionName" => 'areaCodeModifyManage'
		]);
		// 批量操作
		Route::post('batch', 'batch')->append([
			"authorityCheckSubPermissionName" => 'areaCodeModifyManage'
		]);
	})->append([
		//用于权限校验的名称
		'authorityCheckAppendName' => 'areaCodeManage'
    ])->prefix('setting.areaCode/')->middleware([
        \app\adminapi\middleware\CheckAuthor::class
    ]);

});