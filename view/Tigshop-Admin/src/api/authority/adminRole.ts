import type {AdminRoleFilterParams, AdminRoleFilterResult, AdminRoleFormState} from "@/types/authority/adminRole.d";
import request from "@/utils/request";

export const getAdminRoleList = (params: AdminRoleFilterParams) => {
    return request<AdminRoleFilterResult>({
        url: "authority/adminRole/list",
        method: "get",
        params,
    });
}

// 商品分类页面批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "authority/adminRole/batch",
        method: "post",
        data: {type, ...data}
    });
}

export const delAdminRole = (data: object) => {
    return request({
        url: "authority/adminRole/del",
        method: "post",
        data,
    });
}

export  const getAdminRole = (action: string, params: object) => {
    return request<AdminRoleFormState>({
        url: "authority/adminRole/" + action,
        method: "get",
        params
    });
}

export const updateAdminRole = (operation: string, data: object) => {
    return request({
        url: "authority/adminRole/" + operation,
        method: "post",
        data
    });
}

export const updateAdminRoleField = (data:object) => {
    return request({
        url: "authority/adminRole/updateField",
        method: "post",
        data
    });
}
