import request from "../../utils/request";
// 店铺详情
export const getShopDetail = (id) => {
    return request({
        url: `shop/shop/detail?shopId=${id}`,
        method: "get"
    });
};
// 店铺收藏 & 取消收藏
export const shopCollection = (data) => {
    return request({
        url: `shop/shop/collect`,
        method: "post",
        data
    });
};
// 店铺首页
export const getShopDecorate = (id) => {
    return request({
        url: `shop/shop/decorate?shopId=${id}`,
        method: "get"
    });
};
// 店铺分类
export const getShopCategory = (id) => {
    return request({
        url: `shop/category/tree?shopId=${id}`,
        method: "get"
    });
};
// 获得店铺列表
export const getShopList = (params) => {
    return request({
        url: "shop/shop/list",
        method: "get",
        params
    });
};
//# sourceMappingURL=shop.js.map