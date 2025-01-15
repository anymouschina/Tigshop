<?php

use think\facade\Route;

// 公共方法
Route::group('common', function () {
    // 配置
    Route::group('config', function () {
        // 基本配置
        Route::get('base', 'base');
        // 基本配置
        Route::get('mobile_area_code', 'mobileAreaCode');
        // 售后服务配置
        Route::get('after_sales_service', 'afterSalesService');
    })->prefix('common.config/');
    // i18n
    Route::group('i18n', function () {
        // 获得对应语言包
        Route::get('get_locale_translations', 'getLocaleTranslations');
        // 获得语言列表
        Route::get('get_locales', 'getLocales');
        // 获得默认语言
        Route::get('get_default_locale', 'getDefaultLocale');
    })->prefix('common.i18n/');
//记录日志
    Route::get('log', 'common.log/index');
    // PC
    Route::group('pc', function () {
        // 获取头部导航
        Route::get('get_header', 'getHeader');
        // 获取PC导航栏
        Route::get('get_nav', 'getNav');
        // 获取PC分类抽屉
        Route::get('get_cat_floor', 'getCatFloor');
    })->prefix('common.pc/');
    // PC
    Route::group('util', function () {
        // 获取二维码
        Route::get('qr_code', 'qrCode');
        //获取小程序二维码
        Route::get('mini_code', 'getMiniProgramCode');
    })->prefix('common.util/');
    // 推荐位
    Route::group('recommend', function () {
        // 猜你喜欢
        Route::get('guess_like', 'common.recommend/guessLike');
    });
    // 验证
    Route::group('verification', function () {
        // 获取验证码
        Route::post('captcha', 'captcha');
        // 一次验证
        Route::post('check', 'check');
        // 二次验证
        Route::post('verification', 'verification');
    })->prefix('common.verification/');

    // 货币
    Route::group('currency', function () {
        // 获得货币列表
        Route::get('get_currency', 'getCurrency');
    })->prefix('common.currency/');
});