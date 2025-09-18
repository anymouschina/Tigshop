import request from "../../utils/request";
// 获取积分兑换商品列表
export const getExchangeList = (params) => {
    return request({
        url: "product/exchange/list",
        method: "get",
        params
    });
};
export const getExchangeDetail = (id) => {
    return request({
        url: "product/exchange/detail",
        method: "get",
        params: { id }
    });
};
export const addExchangeToCart = (params) => {
    return request({
        url: "product/exchange/addToCart",
        method: "post",
        data: params
    });
};
//# sourceMappingURL=exchange.js.map