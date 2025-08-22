import request from "@/utils/request";
import type {RegionFilterParams, RegionFilterResult, RegionFormState} from "@/types/setting/region"
export const getRegionList = (params: Object) => {
    return request<RegionFilterResult>({
        url: "setting/region/list",
        method: "get",
        params,
    });
}
export const getChildRegionList = (params: RegionFilterParams) => {
    return request<RegionFilterResult>({
        url: "setting/region/getChildRegion",
        method: "get",
        params,
    });
}

export const getRegionTreeList = (params?: RegionFilterParams) => {
    return request<RegionFilterResult>({
        url: "setting/region/getAllRegionTree",
        method: "get",
        params,
    });
}

// 删除
export const delRegion= (data: object) => {
    return request({
        url: "setting/region/del",
        method: "post",
        data,
    });
}
//获取分类详情
export const getRegion  = (action: string, params: object) => {
    return request<RegionFormState>({
        url: "setting/region/" + action,
        method: "get",
        params
    });
}

// 更新分类
export const updateRegion = (operation: string, data: object) => {
    return request({
        url: "setting/region/" + operation,
        method: "post",
        data
    });
}

// 批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "setting/region/batch",
        method: "post",
        data: {type, ...data},
    });
}
// 列表更新项
export const updateRegionField = (data:object) => {
    return request({
        url: "setting/region/updateField",
        method: "post",
        data
    });
}
