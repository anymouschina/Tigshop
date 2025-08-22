import request from "@/utils/request";
import {SuppliersFilterResult, SuppliersFormState, SuppliersFilterParams} from "@/types/vendor/suppliers"
// 供应商列表
export const getSuppliersList = (params: SuppliersFilterParams) => {
    return request<SuppliersFilterResult>({
        url: "vendor/vendor/list",
        method: "get",
        params,
    });
}

//获取分类详情
export const getSuppliers  = (action: string, params: object) => {
    return request<SuppliersFormState>({
        url: "vendor/vendor/" + action,
        method: "get",
        params
    });
}

// 更新分类
export const updateSuppliers = (operation: string, data: object) => {
    return request({
        url: "vendor/vendor/" + operation,
        method: "post",
        data
    });
}
// 列表更新项
export const updateSuppliersField = (data:object) => {
    return request({
        url: "vendor/vendor/updateField",
        method: "post",
        data
    });
}
