import request from "@/utils/request";
import type { ShopDetailResponse, ShopCategoryResponse, shopListResponse } from "@/types/shop/shop";

// 店铺详情
export const getShopDetail = (id: number) => {
    return request<ShopDetailResponse>({
        url: `shop/shop/detail?shopId=${id}`,
        method: "get"
    });
};

// 店铺收藏 & 取消收藏
export const shopCollection = (data: object) => {
    return request({
        url: `shop/shop/collect`,
        method: "post",
        data
    });
};

// 店铺首页
export const getShopDecorate = (id: number) => {
    return request<any>({
        url: `shop/shop/decorate?shopId=${id}`,
        method: "get"
    });
};

// 店铺分类
export const getShopCategory = (id: number) => {
    return request<ShopCategoryResponse>({
        url: `shop/category/tree?shopId=${id}`,
        method: "get"
    });
};

// 获得店铺列表
export const getShopList = (params: object) => {
    return request<shopListResponse>({
        url: "shop/shop/list",
        method: "get",
        params
    });
};
