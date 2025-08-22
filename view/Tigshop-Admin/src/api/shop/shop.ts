import request from "@/utils/request";
import type {ShopFilterResult, ShopFormResult, ShopFormState} from "@/types/shop/shop.d";
// 获取商家列表
export const getShopList = (params: object) => {
    return request<ShopFilterResult>({
        url: "merchant/shop/list",
        method: "get",
        params,
    });
}
// 获取商家下拉列表
export const getShopSelectList = (params: object) => {
    return request<ShopFilterResult>({
        url: "merchant/shop/shopList",
        method: "get",
        params,
    });
}
// 商家列表页面批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "merchant/shop/batch",
        method: "post",
        data: {type, ...data},
    });
}
// 商家列表页面删除项
export const delShop = (data: object) => {
    return request({
        url: "store/store/del",
        method: "post",
        data,
    });
}
// 商家列表页面更新项
export const updateShopFiled = (data: object) => {
    return request({
        url: "merchant/shop/updateField",
        method: "post",
        data,
    });
}
// 获取商家详情
export const getShop = (action: string, params: object) => {
    return request<ShopFormState>({
        url: "merchant/shop/" + action,
        method: "get",
        params
    });
}
// 更新商家
export const updateShop = (operation: string, data: object) => {
    return request({
        url: "merchant/shop/" + operation,
        method: "post",
        data
    });
}

// 店铺资金列表
export const getShopAccountList = (params: object) => {
    return request<ShopFilterResult>({
        url: "merchant/shopAccount/list",
        method: "get",
        params,
    });
}

// 店铺资金日志列表
export const getShopAccountLog = (params: object) => {
    return request<ShopFilterResult>({
        url: "merchant/shopAccount/logList",
        method: "get",
        params,
    });
}

// 获取商家结算设置详情
export const getShopSettlement = (params: object) => {
    return request<ShopFormState>({
        url: "order/config/detail",
        method: "get",
        params
    });
}

// 更新商家结算设置
export const updateShopSettlement = (data: object) => {
    return request({
        url: "order/config/save",
        method: "post",
        data
    });
}
