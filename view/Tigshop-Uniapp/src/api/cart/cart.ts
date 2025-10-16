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
export const removeCartItemData = (data: removeCartItemDataParams & { shopId?: number }) => {
    // 兼容后端对单删/批量删参数差异：
    // 单个使用 cartId，批量使用 cartIds
    const payload: any = { ...data };
    if (Array.isArray(data.cartIds) && data.cartIds.length === 1) {
        payload.cartId = data.cartIds[0];
        delete payload.cartIds;
    }
    return request({
        url: "cart/cart/removeItem",
        method: "post",
        data: payload
    });
};
export const asyncGetCartCount = () => {
    return request<any>({
        url: "cart/cart/getCount",
        method: "get",
        noSkipLogin: true
    });
};
