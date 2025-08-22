import request from "@/utils/request";
import type {CategoryFilterParams, CategoryFilterResult, CategoryFormState, CategoryFilterState} from "@/types/product/category";
// 获取商品分类列表
export const getCategoryList = (params: CategoryFilterParams) => {
    return request<CategoryFilterResult>({
        url: "product/category/list",
        method: "get",
        params,
    });
}

export const getAllCategoryList = (shopId?: number) => {
    return request<CategoryFilterState[]>({
        url: "product/category/getAllCategory",
        method: "get",
        params: {
            shopId
        }
    });
}

// 商品分类页面批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "product/category/batch",
        method: "post",
        data: {type, ...data},
    });
}

// 商品分类页面更新项
export const updateCategoryFiled = (data: object) => {
    return request({
        url: "product/category/updateField",
        method: "post",
        data,
    });
}

export const delCategory = (data: object) => {
    return request({
        url: "product/category/del",
        method: "post",
        data,
    });
}

export  const getCategory = (action: string, params: object) => {
    return request<CategoryFormState>({
        url: "product/category/" + action,
        method: "get",
        params
    });
}

export const updateCategory = (operation: string, data: object) => {
    return request({
        url: "product/category/" + operation,
        method: "post",
        data
    });
}

export const moveCategory = ( data: object) => {
    return request({
        url: "product/category/moveCat",
        method: "post",
        data
    });
}
