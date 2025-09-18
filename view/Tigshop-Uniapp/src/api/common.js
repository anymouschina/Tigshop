import request from "../utils/request";
//  猜你喜欢
export const getGuessLike = (params) => {
    return request({
        url: "common/recommend/guessLike",
        method: "get",
        params
    });
};
export const getGuessLikeIds = (params) => {
    return request({
        url: "common/recommend/getProductIds",
        method: "get",
        params
    });
};
export const getBaseConfig = () => {
    return request({
        url: "common/config/base",
        method: "get"
    });
};
export const initConfigSettings = (previewId) => {
    return request({
        url: "common/config/initConfigSettings",
        method: "get",
        params: { previewId }
    });
};
export const themeSettings = () => {
    return request({
        url: "common/config/themeSettings",
        method: "get"
    });
};
// 获取二维码
export const getQrCode = (url) => {
    return request({
        url: "common/util/qrCode?url=" + url,
        method: "get"
    });
};
export const getMiniCode = (url, productId) => {
    return request({
        url: "common/util/miniCode?path=" + url + "&id=" + productId,
        method: "get"
    });
};
// 获取客服配置
export const getServiceConfig = () => {
    return request({
        url: "home/home/getCustomerServiceConfig",
        method: "get"
    });
};
// 记录日志
export const commonLog = (params) => {
    return request({
        url: "common/log",
        method: "get",
        params
    });
};
// 获取语言包
export const getLang = (localeCode) => {
    return request({
        url: "common/i18n/getLocaleTranslations?localeCode=" + localeCode,
        method: "get"
    });
};
// 获取语言列表
export const getLangList = () => {
    return request({
        url: "common/i18n/getLocales",
        method: "get"
    });
};
// 获得默认语言
export const getDefaultLang = (code) => {
    return request({
        url: "common/i18n/getDefaultLocale?code=" + code,
        method: "get"
    });
};
// 翻译
export const getTranslate = (data) => {
    return request({
        url: "common/translate/translate",
        method: "post",
        data
    });
};
// 货币列表
export const getCurrencyList = () => {
    return request({
        url: "common/currency/getCurrency",
        method: "get"
    });
};
// 获取区域code
export const getmobileAreaCode = () => {
    return request({
        url: "common/config/mobileAreaCode",
        method: "get"
    });
};
// 通用获取商品列表
export const getProductsList = (params) => {
    return request({
        url: "product/product/list",
        method: "get",
        params
    });
};
export const getAppUpdate = (data) => {
    return request({
        url: "appVersion/getAppUpdate",
        method: "post",
        data
    });
};
//# sourceMappingURL=common.js.map