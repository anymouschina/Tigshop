import request from "../../utils/request";
// 首页
export const getIndex = (id) => {
    const url = id ? `home/home/index?previewId=${id}` : "home/home/index";
    return request({
        url,
        method: "get"
    });
};
// 获取首页分类栏
export const getMobileCatNavList = (params) => {
    return request({
        url: "home/home/mobileCatNav",
        method: "get",
        params
    });
};
// 获取首页分类商品列表
export const getCateProduct = (params) => {
    return request({
        url: "product/product/list",
        method: "get",
        params
    });
};
// 获取首页商品
export const getProductList = (params) => {
    return request({
        url: "home/home/getRecommend",
        method: "get",
        params
    });
};
// 首页秒杀
export const getHomeSeckill = () => {
    return request({
        url: "home/home/getSeckill",
        method: "get"
    });
};
// 首页优惠券
export const getHomeCoupon = (id) => {
    const url = id ? `home/home/getCoupon?shopId=${id}` : "home/home/getCoupon";
    return request({
        url,
        method: "get"
    });
};
// 用户模块装修
export const getMemberDecorate = () => {
    return request({
        url: "home/home/memberDecorate",
        method: "get"
    });
};
//获取开屏广告
export const getSplashAd = () => {
    return request({
        url: "decorate/discrete/getOpenAdvertising",
        method: "get"
    });
};
//# sourceMappingURL=home.js.map