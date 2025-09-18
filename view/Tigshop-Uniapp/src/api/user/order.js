import request from "../../utils/request";
// 获取商品订单列表
export const getOrderList = (params) => {
    return request({
        url: "user/order/list",
        method: "get",
        params
    });
};
export const getOrderNum = () => {
    return request({
        url: "user/order/orderNum",
        method: "get"
    });
};
// 删除
export const delOrder = (data) => {
    return request({
        url: "user/order/delOrder",
        method: "post",
        data
    });
};
// 取消订单
export const cancelOrder = (data) => {
    return request({
        url: "user/order/cancelOrder",
        method: "post",
        data
    });
};
//获取订单详情
export const getOrder = (params) => {
    return request({
        url: "user/order/detail",
        method: "get",
        params
    });
};
// 再次购买
export const orderBuyAgain = (data) => {
    return request({
        url: "user/order/buyAgain",
        method: "post",
        data
    });
};
export const confirmReceipt = (data) => {
    return request({
        url: "user/order/confirmReceipt",
        method: "post",
        data
    });
};
export const getShippingInfo = (params) => {
    return request({
        url: "user/order/shippingInfo",
        method: "get",
        params
    });
};
//# sourceMappingURL=order.js.map