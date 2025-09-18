import request from "../../utils/request";
// 收藏商品列表
export const getCollectProductList = (params) => {
    return request({
        url: "user/collectProduct/list",
        method: "get",
        params
    });
};
// 取消收藏商品
export const delCollectProduct = (data) => {
    return request({
        url: "user/collectProduct/cancel",
        method: "post",
        data
    });
};
//# sourceMappingURL=collectProduct.js.map