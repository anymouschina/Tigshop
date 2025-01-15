<?php

use think\facade\Route;

// 配置组
Route::group('setting', function () {
    // APP版本管理
    Route::group('app_version', function () {
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
    ])->prefix('setting.appVersion/');

    // 授权管理
    Route::group('licensed', function () {
        // 详情
        Route::get('index', 'index');
        // 添加
        Route::post('update', 'update')->append([
            "authorityCheckSubPermissionName" => 'licensedModifyManage'
        ]);

    })->append([
        //用于权限校验的名称
        'authorityCheckAppendName' => 'licensed'
    ])->prefix('setting.licensed/');

    // 设置项管理
    Route::group('config', function () {
        // 基础设置
        Route::get('get_base', 'getBase');
        // 商城基础配置
        Route::get('basic_config', 'basicConfig');
        // 保存商城基础配置
        Route::post('save_basic', 'saveBasic')->append([
            "authorityCheckSubPermissionName" => 'saveBasicManage'
        ]);
        // 前端后台设置项
        Route::get('get_admin', 'getAdmin');
        // 基础设置更新
        Route::post('save', 'save')->append([
            "authorityCheckSubPermissionName" => 'settingSaveManage'
        ]);
        // 编辑
        Route::post('update', 'update')->append([
            "authorityCheckSubPermissionName" => 'settingUpdateManage'
        ]);
        // 邮箱服务器设置
        Route::post('save_mail', 'saveMail')->append([
            "authorityCheckSubPermissionName" => 'settingSaveMailManage'
        ]);
        // 获取图标icon
        Route::get('get_icon', 'getIcon');
        // 发送测试邮件
        Route::post('send_test_email', 'sendTestEmail')->append([
			"authorityCheckSubPermissionName" => 'sendTestEmailModifyManage'
		]);
        // 上传API文件
        Route::post('upload_file', 'uploadFile')->append([
			"authorityCheckSubPermissionName" => 'uploadFileModifyManage'
		]);
        // 生成平台证书
        Route::post('create_platform_certificate', 'createPlatformCertificate')->append([
			"authorityCheckSubPermissionName" => 'platformCertificateModifyManage'
		]);
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendName' => 'config'
    ])->prefix('setting.config/');

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
//        Route::post('update_field', 'updateField');
//        // 删除
//        Route::post('del', 'del');
//        // 批量操作
//        Route::post('batch', 'batch');
//    })->append([
//        //用于权限校验的名称
//        'authorityCheckAppendName' => 'cronsManage'
//    ])->prefix('setting.crons/');

    // 友情链接
    Route::group('friend_links', function () {
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
        Route::post('update_field', 'updateField')->append([
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
    ])->prefix('setting.friendLinks/');

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
		Route::post('update_field', 'updateField')->append([
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
    ])->prefix('setting.gallery/');

    // 相册图片
    Route::group('gallery_pic', function () {
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
        Route::post('update_field', 'updateField')->append([
			"authorityCheckSubPermissionName" => 'galleryPicModifyManage'
		]);
        // 图片上传
        Route::post('upload_img', 'uploadImg')->append([
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
    ])->prefix('setting.galleryPic/');

    // 物流公司
    Route::group('logistics_company', function () {
        // 分页列表
        Route::get('list', 'list');
        // 全部列表
        Route::get('get_all', 'getAll');
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
        Route::post('update_field', 'updateField')->append([
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
    ])->prefix('setting.logisticsCompany/');

    // 邮件模板设置
    Route::group('mail_templates', function () {
        // 列表
        Route::get('list', 'list');
        // 编辑
        Route::post('update', 'update')->append([
            "authorityCheckSubPermissionName" => 'mailTemplatesUpdateManage'
        ]);
        // 获取所有的邮件模板
        Route::get('get_all_mail_templates', 'getAllMailTemplates');
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendGroupName' => 'mailTemplateManage'
    ])->prefix('setting.mailTemplates/');

    // 消息设置
    Route::group('message_type', function () {
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
        Route::post('update_field', 'updateField')->append([
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
        Route::post('mini_program_message_template', 'miniProgramMessageTemplate')->append([
            "authorityCheckSubPermissionName" => 'miniProgramMessageTemplateManage'
        ]);
        // 同步小程序消息模板
        Route::post('mini_program_message_template_sync', 'miniProgramMessageTemplateSync')->append([
            "authorityCheckSubPermissionName" => 'miniProgramMessageTemplateSyncManage'
        ]);
        // 生成公众号消息模板
        Route::post('wechat_message_template', 'wechatMessageTemplate')->append([
            "authorityCheckSubPermissionName" => 'wechatMessageTemplateManage'
        ]);
        // 同步公众号消息模板
        Route::post('wechat_message_template_sync', 'wechatMessageTemplateSync')->append([
            "authorityCheckSubPermissionName" => 'wechatMessageTemplateSyncManage'
        ]);
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendGroupName' => 'messageTypeManage'
    ])->prefix('setting.messageType/');

    // 地区管理
    Route::group('region', function () {
        // 列表
        Route::get('list', 'list');
        // 详情
        Route::get('detail', 'detail');
        // 获取地区树
        Route::get('get_region_tree', 'getRegionTree');
        // 获取所有地区树
        Route::get('get_all_region_tree', 'getAllRegionTree');
        // 获取子地区
        Route::get('get_child_region', 'getChildRegion');
        // 添加
        Route::post('create', 'create')->append([
            "authorityCheckSubPermissionName" => 'regionUpdateManage'
        ]);
        // 编辑
        Route::post('update', 'update')->append([
            "authorityCheckSubPermissionName" => 'regionUpdateManage'
        ]);
        // 更新单个字段
        Route::post('update_field', 'updateField')->append([
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
    ])->prefix('setting.region/');

    // 运费模板管理
    Route::group('shipping_tpl', function () {
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
        Route::post('update_field', 'updateField')->append([
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
    ])->prefix('setting.shippingTpl/');

    // 配送类型
    Route::group('shipping_type', function () {
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
        Route::post('update_field', 'updateField')->append([
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
    ])->prefix('setting.shippingType/');

	// 内置相册
	Route::group('album', function () {
		// 列表
		Route::get('list', 'list');
		// 更新单个字段
		Route::post('update_field', 'updateField')->append([
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
	])->prefix('setting.album/');

	// 区号维护
	Route::group('area_code', function () {
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
		Route::post('update_field', 'updateField')->append([
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
	])->prefix('setting.areaCode/');

})->middleware([
    \app\adminapi\middleware\CheckAuthor::class
]);
