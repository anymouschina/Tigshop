import request from "../../utils/request";
export const salesmanProductList = (params) => {
    return request({
        url: "salesman/product/list",
        method: "get",
        params
    });
};
export const salesmanProductDetail = (id) => {
    return request({
        url: `salesman/product/detail?productId=${id}`,
        method: "get"
    });
};
// 分销订单
export const salesmanOrderList = (params) => {
    return request({
        url: "salesman/order/list",
        method: "get",
        params
    });
};
// 赚钱攻略
export const salesmanContentList = (params) => {
    return request({
        url: "salesman/content/list",
        method: "get",
        params
    });
};
export const salesmanContentDetail = (id) => {
    return request({
        url: `salesman/content/detail?id=${id}`,
        method: "get"
    });
};
//
export const salesmanUserinfo = (id) => {
    return request({
        url: `salesman/salesman/userInfo?salesmanId=${id}`,
        method: "get"
    });
};
// 素材分类
export const materialCategoryList = () => {
    return request({
        url: "salesman/material/category",
        method: "get"
    });
};
// 素材列表
export const materialList = (params) => {
    return request({
        url: "salesman/material/list",
        method: "get",
        params
    });
};
// 素材详情
export const materialDetail = (id) => {
    return request({
        url: `salesman/material/detail?id=${id}`,
        method: "get"
    });
};
//# sourceMappingURL=salesman.js.map