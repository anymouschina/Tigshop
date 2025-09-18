import request from "../../utils/request";
// 获取购物车
export const getCart = () => {
    return request({
        url: "cart/cart/list",
        method: "get",
        noSkipLogin: true
    });
};
export const updateCartItemData = (data) => {
    return request({
        url: "cart/cart/updateItem",
        method: "post",
        data
    });
};
export const updateCartCheck = (data) => {
    return request({
        url: "cart/cart/updateCheck",
        method: "post",
        data
    });
};
export const clearCart = () => {
    return request({
        url: "cart/cart/clear",
        method: "post"
    });
};
export const removeCartItemData = (data) => {
    return request({
        url: "cart/cart/removeItem",
        method: "post",
        data
    });
};
export const asyncGetCartCount = () => {
    return request({
        url: "cart/cart/getCount",
        method: "get",
        noSkipLogin: true
    });
};
//# sourceMappingURL=cart.js.map