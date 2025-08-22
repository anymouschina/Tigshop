import request from "@/utils/request";
import type {
    SalesmanProductListResponse,
    SalesmanProductDetailResponse,
    OrderListResponse,
    SalesmanContentListResponse,
    MaterialCategoryResponse,
    MaterialListResponse
} from "@/types/salesman/salesman";

export const salesmanProductList = (params: any) => {
    return request<SalesmanProductListResponse>({
        url: "salesman/product/list",
        method: "get",
        params
    });
};
export const salesmanProductDetail = (id: number) => {
    return request<SalesmanProductDetailResponse>({
        url: `salesman/product/detail?productId=${id}`,
        method: "get"
    });
};

// 分销订单
export const salesmanOrderList = (params: any) => {
    return request<OrderListResponse>({
        url: "salesman/order/list",
        method: "get",
        params
    });
};

// 赚钱攻略
export const salesmanContentList = (params: any) => {
    return request<SalesmanContentListResponse>({
        url: "salesman/content/list",
        method: "get",
        params
    });
};

export const salesmanContentDetail = (id: number) => {
    return request<any>({
        url: `salesman/content/detail?id=${id}`,
        method: "get"
    });
};

//
export const salesmanUserinfo = (id: number) => {
    return request<any>({
        url: `salesman/salesman/userInfo?salesmanId=${id}`,
        method: "get"
    });
};

// 素材分类
export const materialCategoryList = () => {
    return request<MaterialCategoryResponse>({
        url: "salesman/material/category",
        method: "get"
    });
};
// 素材列表
export const materialList = (params: any) => {
    return request<MaterialListResponse>({
        url: "salesman/material/list",
        method: "get",
        params
    });
};
// 素材详情
export const materialDetail = (id: number) => {
    return request<any>({
        url: `salesman/material/detail?id=${id}`,
        method: "get"
    });
};
