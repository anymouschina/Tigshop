import request from "@/utils/request";
import type { updateCartItemDataParams, updateCartCheckParams, removeCartItemDataParams, CartResponse } from "@/types/cart/cart";
// 获取购物车
export const getCart = () => {
    return request<CartResponse>({
        url: "cart/cart/list",
        method: "get",
        noSkipLogin: true
    });
};
export const updateCartItemData = (data: updateCartItemDataParams) => {
    return request({
        url: "cart/cart/updateItem",
        method: "post",
        data
    });
};
export const updateCartCheck = (data: updateCartCheckParams) => {
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
export const removeCartItemData = (data: removeCartItemDataParams) => {
    return request({
        url: "cart/cart/removeItem",
        method: "post",
        data
    });
};
export const asyncGetCartCount = () => {
    return request<any>({
        url: "cart/cart/getCount",
        method: "get",
        noSkipLogin: true
    });
};
