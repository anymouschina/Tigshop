import request from "@/utils/request";
import type { ExchangeListResponse } from "@/types/exchange/exchange";
import type { AddCartResponse } from "@/types/product/product";

// 获取积分兑换商品列表
export const getExchangeList = (params: object) => {
    return request<ExchangeListResponse>({
        url: "product/exchange/list",
        method: "get",
        params
    });
};
export const getExchangeDetail = (id: number) => {
    return request({
        url: "product/exchange/detail",
        method: "get",
        params: { id }
    });
};
export const addExchangeToCart = (params: AnyObject) => {
    return request<AddCartResponse>({
        url: "product/exchange/addToCart",
        method: "post",
        data: params
    });
};
