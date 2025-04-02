<?php

use think\facade\Route;

// 会员中心
Route::group('user', function () {
    // 账户明细
    Route::group('account', function () {
        // 账户金额变动列表
        Route::get('list', 'user.account/list');
    })->middleware([
        \app\api\middleware\CheckLogin::class,
    ]);
    // 收货地址
    Route::group('address', function () {
        // 收货地址列表
        Route::get('list', 'user.address/list');
        // 收货地址详情
        Route::get('detail', 'user.address/detail');
        // 收货地址添加
        Route::post('create', 'user.address/create');
        // 收货地址更新
        Route::post('update', 'user.address/update');
        // 收货地址删除
        Route::post('del', 'user.address/del');
        // 设为选中
        Route::post('set_selected', 'user.address/setSelected');
    })->middleware([
        \app\api\middleware\CheckLogin::class,
    ]);
    // 售后
    Route::group('aftersales', function () {
        // 可售后订单列表
        Route::get('list', 'user.aftersales/list');
        // 配置型
        Route::get('config', 'user.aftersales/config');
        // 售后详情
        Route::get('apply_data', 'user.aftersales/applyData');
        // 售后申请
        Route::post('create', 'user.aftersales/create');
        // 售后申请修改
        Route::post('update', 'user.aftersales/update');
        // 售后申请记录
        Route::get('get_record', 'user.aftersales/getRecord');
        // 查看售后记录
        Route::get('detail', 'user.aftersales/detail');
        // 查看售后log记录
        Route::get('detail_log', 'user.aftersales/detailLog');
        // 提交售后反馈记录
        Route::post('feedback', 'user.aftersales/feedback');
        // 撤销申请售后
        Route::post('cancel', 'user.aftersales/cancel');
    })->middleware([
        \app\api\middleware\CheckLogin::class,
    ]);
    // 商品收藏
    Route::group('collect_product', function () {
        // 商品收藏列表
        Route::get('list', 'user.collectProduct/list');
        // 收藏商品
        Route::post('save', 'user.collectProduct/save');
        // 取消收藏
        Route::post('cancel', 'user.collectProduct/cancel');
    })->middleware([
        \app\api\middleware\CheckLogin::class,
    ]);
    // 评论晒单
    Route::group('comment', function () {
        // 评论晒单数量
        Route::get('sub_num', 'user.comment/subNum');
        // 晒单列表
        Route::get('showed_list', 'user.comment/showedList');
        // 已评价列表
        Route::get('list', 'user.comment/list');
        // 商品评价 / 晒单
        Route::post('evaluate', 'user.comment/evaluate');
        // 评价/晒单详情
        Route::get('detail', 'user.comment/detail');
    })->middleware([
        \app\api\middleware\CheckLogin::class,
    ]);
    // 优惠券
    Route::group('coupon', function () {
        // 会员优惠券列表
        Route::get('list', 'user.coupon/list')->middleware([
            \app\api\middleware\CheckLogin::class,
        ]);
        // 删除优惠券
        Route::post('del', 'user.coupon/del')->middleware([
            \app\api\middleware\CheckLogin::class,
        ]);
        // 优惠券列表
        Route::get('get_list', 'user.coupon/getList');
        // 领取优惠券
        Route::post('claim', 'user.coupon/claim')->middleware([
            \app\api\middleware\CheckLogin::class,
        ]);
        // 优惠券详情
        Route::get('detail', 'user.coupon/detail')->middleware([
            \app\api\middleware\CheckLogin::class,
        ]);
    });
    // 留言咨询
    Route::group('feedback', function () {
        // 订单咨询/留言列表
        Route::get('list', 'user.feedback/list');
        // 提交留言
        Route::post('submit', 'user.feedback/submit');
    })->middleware([
        \app\api\middleware\CheckLogin::class,
    ]);
    // 增票资质发票
    Route::group('invoice', function () {
        // 详情
        Route::get('detail', 'user.invoice/detail');
        // 添加
        Route::post('create', 'user.invoice/create');
        // 更新
        Route::post('update', 'user.invoice/update');
        // 判断当前用户的增票资质是否审核通过
        Route::get('get_status', 'user.invoice/getStatus');
    })->middleware([
        \app\api\middleware\CheckLogin::class,
    ]);
    // 登录
    Route::group('login', function () {
        //快捷登录设置项目
        Route::get('get_quick_login_setting', 'getQuickLoginSetting');
        // 登录
        Route::post('signin', 'signin');
        // 获取验证码
        Route::post('send_mobile_code', 'sendMobileCode');
        // 验证手机号
        Route::post('check_mobile', 'checkMobile');
        // 忘记密码 -- 修改密码
        Route::post('forget_password', 'forgetPassword');
        // 获得微信授权url
        Route::get('get_wx_login_url', 'getWechatLoginUrl');
        // 通过微信code获得微信用户信息
        Route::get('get_wx_login_info_by_code', 'getWechatLoginInfoByCode');
        //第三方绑定手机号
        Route::post('bind_mobile', 'bindMobile');
        //绑定微信公众号
        Route::post('bind_wechat', 'bindWechat')->middleware([\app\api\middleware\CheckLogin::class]);
        //解除绑定微信公众号
        Route::get('unbind_wechat', 'unbindWechat')->middleware([\app\api\middleware\CheckLogin::class]);
        //微信服务器校验
        Route::get('wechat_server', 'wechatServerVerify');
        //获取微信推送消息
        Route::post('wechat_server', 'getWechatMessage');
        //检测微信用户操作事件
        Route::post('wechat_event', 'wechatEvent');
        //获取手机号
        Route::post('get_mobile', 'getUserMobile');
        //获取用户openid
        Route::post('update_user_openid', 'updateUserOpenId')->middleware([\app\api\middleware\CheckLogin::class]);
        //获取jssdk配置项
        Route::post('get_js_sdk_config', 'getJsSdkConfig')->middleware([\app\api\middleware\CheckLogin::class]);
    })->prefix("user.login/");
    // 站内信
    Route::group('message', function () {
        // 站内信列表
        Route::get('list', 'user.message/list');
        // 全部标记已读
        Route::post('update_all_read', 'user.message/updateAllRead');
        // 设置站内信已读
        Route::post('update_message_read', 'user.message/updateMessageRead');
        // 删除站内信
        Route::post('del', 'user.message/del');
    })->middleware([
        \app\api\middleware\CheckLogin::class,
    ]);

    // 订单
    Route::group('order', function () {
        // 列表
        Route::get('list', 'user.order/list');
        // 详情
        Route::get('detail', 'user.order/detail');
        // 数量
        Route::get('order_num', 'user.order/orderNum');
        // 取消
        Route::post('cancel_order', 'user.order/cancelOrder');
        // 删除
        Route::post('del_order', 'user.order/delOrder');
        // 收货
        Route::post('confirm_receipt', 'user.order/confirmReceipt');
        // 物流信息
        Route::get('shipping_info', 'user.order/shippingInfo');
        // 再次购买
        Route::post('buy_again', 'user.order/buyAgain');
    })->middleware([
        \app\api\middleware\CheckLogin::class,
    ]);
    // 订单发票
    Route::group('order_invoice', function () {
        //详情
        Route::get('detail', 'detail');
        // 新增
        Route::post('create', 'create');
        // 编辑
        Route::post('update', 'update');
    })->middleware([
        \app\api\middleware\CheckLogin::class,
    ])->prefix("user.order_invoice/");
    // 积分
    Route::group('points_log', function () {
        // 列表
        Route::get('list', 'user.pointsLog/list');
    })->middleware([
        \app\api\middleware\CheckLogin::class,
    ]);
    // 充值
    Route::group('recharge_order', function () {
        // 列表
        Route::get('list', 'user.rechargeOrder/list');
        // 充值申请
        Route::post('update', 'user.rechargeOrder/update');
        // 充值金额列表
        Route::get('setting', 'user.rechargeOrder/setting');
        // 充值支付列表
        Route::get('payment_list', 'user.rechargeOrder/paymentList');
        // 充值支付
        Route::post('pay', 'user.rechargeOrder/pay');
        // 充值支付
        Route::post('create', 'user.rechargeOrder/create');
        // 获取充值支付状态
        Route::get('check_status', 'user.rechargeOrder/checkStatus');
    })->middleware([
        \app\api\middleware\CheckLogin::class,
    ]);
    // 会员注册
    Route::group('regist', function () {
        // 会员注册操作
        Route::post('regist_act', 'registAct');
		// 邮箱验证码
		Route::post('send_email_code', 'sendEmailCode');
    })->prefix("user.regist/");
    // 会员
    Route::group('user', function () {
        // 会员详情
        Route::get('detail', 'detail');
        // 修改个人信息
        Route::post('update_information', 'updateInformation');
        // 会员中心首页数据
        Route::get('member_center', 'memberCenter');
        // 授权回调获取用户信息
        Route::post('oAuth', 'oAuth');
        // 修改密码获取验证码
        Route::post('send_mobile_code_by_modify_password', 'sendMobileCodeByModifyPassword');
        // 修改密码手机验证
        Route::post('check_modify_password_mobile_code', 'checkModifyPasswordMobileCode');
        // 修改密码
        Route::post('modify_password', 'modifyPassword');
        // 手机修改获取验证码
        Route::post('send_mobile_code_by_mobile_validate', 'sendMobileCodeByMobileValidate');
        // 手机修改新手机获取验证码
        Route::post('send_mobile_code_by_modify_mobile', 'sendMobileCodeByModifyMobile');
        // 手机绑定
        Route::post('modify_mobile', 'modifyMobile');
        // 手机验证
        Route::post('mobile_validate', 'mobileValidate');
        // 邮箱验证
        Route::post('email_validate', 'emailValidate');
        // 最近浏览
        Route::get('history_product', 'historyProduct');
        // 最近浏览
        Route::post('del_history_product', 'delHistoryProduct');
        // 上传文件接口
        Route::post('upload_img', 'uploadImg');
        // 修改头像
        Route::post('modify_avatar', 'modifyAvatar');
        // 我收藏的
        Route::get('collection_shop', 'myCollectShop');
        // 会员等级列表
        Route::get('level_list', 'levelList');
        //会员权益信息
        Route::get('level_info', 'levelInfo');
    })->middleware([
        \app\api\middleware\CheckLogin::class,
    ])->prefix("user.user/");
    // 提现
    Route::group('withdraw_apply', function () {
        // 列表
        Route::get('list', 'user.withdrawApply/list');
        // 添加提现账号
        Route::post('create_account', 'user.withdrawApply/createAccount');
        // 编辑提现账号
        Route::post('update_account', 'user.withdrawApply/updateAccount');
        // 提现账号详情
        Route::get('account_detail', 'user.withdrawApply/accountDetail');
        // 删除提现账号
        Route::post('del_account', 'user.withdrawApply/delAccount');
        // 提现申请
        Route::post('apply', 'user.withdrawApply/apply');
    })->middleware([
        \app\api\middleware\CheckLogin::class,
    ]);
    // 签到
    Route::group('sign', function () {
        // 账户金额变动列表
        Route::get('index', 'user.sign/index');
        Route::get('sign', 'user.sign/signIn');
    })->middleware([
        \app\api\middleware\CheckLogin::class,
    ]);

	// 会员企业认证
	Route::group('company', function () {
		// 申请企业认证
		Route::post('apply', 'apply');
		// 认证详情
		Route::get('detail', 'detail');
		// 我的申请
		Route::get('my_apply', 'myApply');
	})->middleware([
		\app\api\middleware\CheckLogin::class,
	])->prefix("user.company/");
});
