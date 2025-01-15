<?php

use think\facade\Route;

//订单模块
Route::group('order', function () {
    //售后管理
    Route::group('aftersales', function () {
        // 列表
        Route::get('list', 'order.aftersales/list');
        // 详情接口
        Route::get('detail', 'order.aftersales/detail');
        // 同意或拒接售后接口
        Route::post('update', 'order.aftersales/update')->append([
            "authorityCheckSubPermissionName" => 'aftersalesModifyManage'
        ]);
        // 售后确认收货接口
        Route::post('receive', 'order.aftersales/receive')->append([
            "authorityCheckSubPermissionName" => 'aftersalesModifyManage'
        ]);
        // 提交售后反馈记录
        Route::post('record', 'order.aftersales/record')->append([
            "authorityCheckSubPermissionName" => 'aftersalesModifyManage'
        ]);
    });
    //订单管理
    Route::group('order', function () {
        //订单列表
        Route::get('list', 'list');
        //订单详情
        Route::get('detail', 'detail');
        //获取电子面单接口
        Route::get('order_way_bill', 'printOrderWaybill');
        //父订单详情
        Route::get('parent_detail', 'parentOrderDetail');
        //订单发货
        Route::post('deliver', 'deliver')->append([
            "authorityCheckSubPermissionName" => 'orderDeliverManage'
        ]);
        //订单收货
        Route::post('confirm_receipt', 'confirmReceipt')->append([
            "authorityCheckSubPermissionName" => 'orderConfirmReceiptManage'
        ]);
        //订单修改收货人信息
        Route::post('modify_consignee', 'modifyConsignee')->append([
            "authorityCheckSubPermissionName" => 'orderModifyConsigneeManage'
        ]);
        //修改配送信息
        Route::post('modify_shipping', 'modifyShipping')->append([
            "authorityCheckSubPermissionName" => 'orderModifyShippingManage'
        ]);
        //修改订单金额
        Route::post('modify_money', 'modifyMoney')->append([
            "authorityCheckSubPermissionName" => 'orderModifyMoneyManage'
        ]);
        //取消订单
        Route::post('cancel_order', 'cancelOrder')->append([
            "authorityCheckSubPermissionName" => 'cancelOrderManage'
        ]);
        //订单设置为已确认
        Route::post('set_confirm', 'setConfirm')->append([
            "authorityCheckSubPermissionName" => 'setConfirmManage'
        ]);
        //订单软删除
        Route::post('del_order', 'delOrder')->append([
            "authorityCheckSubPermissionName" => 'delOrderManage'
        ]);
        //订单拆分
        Route::post('split_store_order', 'splitStoreOrder')->append([
            "authorityCheckSubPermissionName" => 'splitStoreOrderManage'
        ]);
        //订单设置为已支付
        Route::post('set_paid', 'setPaid')->append([
            "authorityCheckSubPermissionName" => 'setPaidManage'
        ]);
        //修改商品信息
        Route::post('modify_product', 'modifyProduct')->append([
            "authorityCheckSubPermissionName" => 'modifyProductManage'
        ]);
        //添加商品时获取商品信息
        Route::post('get_add_product_info', 'getAddProductInfo');
        //设置商家备注
        Route::post('set_admin_note', 'setAdminNote')->append([
            "authorityCheckSubPermissionName" => 'setAdminNoteManage'
        ]);
        //打印订单
        Route::get('order_print', 'orderPrint');
        //打印订单
        Route::get('order_print_bill', 'orderPrintWaybill');
        //订单导出标签列表
        Route::get('get_export_item_list', 'getExportItemList');
        //订单导出存的标签
        Route::post('save_export_item', 'saveExportItem');
        //标签详情
        Route::get('export_item_info', 'exportItemInfo');
        //订单导出
        Route::get('order_export', 'orderExport');
		// 批量操作
		Route::post('batch', 'batch')->append([
			"authorityCheckSubPermissionName" => 'splitStoreOrderManage'
		]);
		// 批量详情
		Route::get('several_detail', 'severalDetail');
		// 批量打印
		Route::get('print_several', 'printSeveral');
    })->prefix("order.order/");
    //日志管理
    Route::group('order_log', function () {
        // 列表
        Route::get('list', 'order.orderLog/list');
        // 添加日志
        Route::post('create', 'order.orderLog/create')->append([
            "authorityCheckSubPermissionName" => 'orderLogModifyManage'
        ]);
    });
    // 订单配置
    Route::group('config', function () {
        // 详情
        Route::get('detail', 'detail');
        // 修改
        Route::post('save', 'save')->append([
            "authorityCheckSubPermissionName" => 'orderConfigModifyManage'
        ]);
    })->prefix("order.config/");
})->middleware([
    \app\adminapi\middleware\CheckAuthor::class
]);