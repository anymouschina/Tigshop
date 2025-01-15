<?php

use think\facade\Route;

// 获取所有权限
Route::get('authority/authority/get_all_authority', 'authority.authority/getAllAuthority');

// 权限组
Route::group('authority', function () {
    // 管理员日志
    Route::group('admin_log', function () {
        // 列表
        Route::get('list', 'authority.adminLog/list')->append([
            //用于权限校验的名称
            'authorityCheckAppendName' => 'adminLogManage'
        ]);
    });

    // 角色管理
    Route::group('admin_role', function () {
        // 角色列表
        Route::get('list', 'authority.adminRole/list');
        // 角色详情
        Route::get('detail', 'authority.adminRole/detail');
        // 角色添加
        Route::post('create', 'authority.adminRole/create')->append([
            "authorityCheckSubPermissionName" => 'adminRoleUpdateManage'
        ]);
        // 角色编辑
        Route::post('update', 'authority.adminRole/update')->append([
            "authorityCheckSubPermissionName" => 'adminRoleUpdateManage'
        ]);
        // 角色删除
        Route::post('del', 'authority.adminRole/del')->append([
            "authorityCheckSubPermissionName" => 'adminRoleDelManage'
        ]);
        // 更新字段
        Route::post('update_field', 'authority.adminRole/updateField')->append([
            "authorityCheckSubPermissionName" => 'adminRoleUpdateManage'
        ]);
        // 批量操作
        Route::post('batch', 'authority.adminRole/batch')->append([
            "authorityCheckSubPermissionName" => 'adminRoleBatchManage'
        ]);
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendName' => 'adminRoleManage'
    ]);

    // 管理员
    Route::group('admin_user', function () {
        // 管理员列表
        Route::get('list', 'authority.adminUser/list');
        // 指定管理员详情
        Route::get('detail', 'authority.adminUser/detail');
        // 当前管理员详情
        Route::get('mine_detail', 'authority.adminUser/mineDetail');
        // 管理员添加
        Route::post('create', 'authority.adminUser/create')->append([
            "authorityCheckSubPermissionName" => 'adminUserUpdateManage'
        ]);
        // 管理员编辑
        Route::post('update', 'authority.adminUser/update')->append([
            "authorityCheckSubPermissionName" => 'adminUserUpdateManage'
        ]);
        // 管理员删除
        Route::post('del', 'authority.adminUser/del')->append([
            "authorityCheckSubPermissionName" => 'adminUserDelManage'
        ]);
        //更新字段
        Route::post('update_field', 'updateField')->append([
            "authorityCheckSubPermissionName" => 'adminUserUpdateManage'
        ]);
        // 配置
        Route::get('config', 'authority.adminUser/config');
        // 批量操作
        Route::post('batch', 'authority.adminUser/batch')->append([
            "authorityCheckSubPermissionName" => 'adminUserBatchManage'
        ]);
        // 账户修改
        Route::post('modify_manage_accounts', 'authority.adminUser/modifyManageAccounts')->append([
            "authorityCheckSubPermissionName" => 'modifyManageAccountsManage'
        ]);
        // 获取验证码
        Route::get('get_code', 'authority.adminUser/getCode');
        // 验证验证码
        Route::post('check_code', 'authority.adminUser/checkCode');
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendName' => 'adminUserManage'
    ]);

    // 权限管理
    Route::group('authority', function () {
        // 权限列表
        Route::get('list', 'authority.authority/list');
        // 权限详情
        Route::get('detail', 'authority.authority/detail');
        // 权限添加
        Route::post('create', 'authority.authority/create')->append([
            "authorityCheckSubPermissionName" => 'authorityUpdateManage'
        ]);
        // 权限编辑
        Route::post('update', 'authority.authority/update')->append([
            "authorityCheckSubPermissionName" => 'authorityUpdateManage'
        ]);

        // 权限删除
        Route::post('del', 'authority.authority/del')->append([
            "authorityCheckSubPermissionName" => 'authorityDelManage'
        ]);
        // 更新字段
        Route::post('update_field', 'authority.authority/updateField')->append([
            "authorityCheckSubPermissionName" => 'authorityUpdateManage'
        ]);
        // 批量操作
        Route::post('batch', 'authority.authority/batch')->append([
            "authorityCheckSubPermissionName" => 'authorityBatchManage'
        ]);
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendName' => 'authorityManage'
    ]);

    // 供应商管理
    Route::group('suppliers', function () {
        // 供应商列表
        Route::get('list', 'authority.suppliers/list');
        // 供应商详情
        Route::get('detail', 'authority.suppliers/detail');
        // 供应商添加
        Route::post('create', 'authority.suppliers/create')->append([
            "authorityCheckSubPermissionName" => 'suppliersUpdateManage'
        ]);
        // 供应商编辑
        Route::post('update', 'authority.suppliers/update')->append([
            "authorityCheckSubPermissionName" => 'suppliersUpdateManage'
        ]);
        // 供应商删除
        Route::post('del', 'authority.suppliers/del')->append([
            "authorityCheckSubPermissionName" => 'suppliersDelManage'
        ]);
        // 更新字段
        Route::post('update_field', 'authority.suppliers/updateField')->append([
            "authorityCheckSubPermissionName" => 'suppliersUpdateManage'
        ]);
        // 批量操作
        Route::post('batch', 'authority.suppliers/batch')->append([
            "authorityCheckSubPermissionName" => 'suppliersBatchManage'
        ]);
    })->append([
        //用于权限校验的名称
        'authorityCheckAppendName' => 'suppliersManage'
    ]);

})->middleware([
    \app\adminapi\middleware\CheckAuthor::class
]);