import request from "@/utils/request";
import {AdminUserFilterResult, AdminUserFormState, AdminUserFilterParams} from "@/types/authority/adminUser"

// 获取管理员列表列表
export const getAdminUserList = (params: AdminUserFilterParams) => {
    return request<AdminUserFilterResult>({
        url: "authority/adminUser/list",
        method: "get",
        params,
    });
}
// 获取会员
export const getAdminUserSearch = (params:any) => {
    return request<any>({
        url: "user/user/search",
        method: "get",
        params: {
            mobile: params
        }
    });
}
// 获取管理员列表配置
export const getAdminUserConfig = () => {
    return request<any>({
        url: "authority/adminUser/config",
        method: "get"
    });
}

// 删除
export const delAdminUser= (data: object) => {
    return request({
        url: "authority/adminUser/del",
        method: "post",
        data,
    });
}
//获取详情
export const getAdminUser  = (action: string, params: object) => {
    return request<AdminUserFormState>({
        url: "authority/adminUser/" + action,
        method: "get",
        params
    });
}

// 更新列表
export const updateAdminUser = (operation: string, data: object) => {
    return request({
        url: "authority/adminUser/" + operation,
        method: "post",
        data
    });
}

// 批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "authority/adminUser/batch",
        method: "post",
        data: {type, ...data}
    });
}
// 列表更新项
export const updateAdminUserField = (data:object) => {
    return request({
        url: "authority/adminUser/updateField",
        method: "post",
        data
    });
}


// 获取管理员列表列表
export const getShopUserList = (params: AdminUserFilterParams) => {
    return request<AdminUserFilterResult>({
        url: "merchant/adminUserShop/list",
        method: "get",
        params,
    });
}
// 删除
export const delShopUser= (data: object) => {
    return request({
        url: "merchant/adminUserShop/del",
        method: "post",
        data,
    });
}
//获取详情
export const getShopUser  = (action: string, params: object) => {
    return request<AdminUserFormState>({
        url: "merchant/adminUserShop/" + action,
        method: "get",
        params
    });
}

// 更新列表
export const updateShopUser = (operation: string, data: object) => {
    return request({
        url: "merchant/adminUserShop/" + operation,
        method: "post",
        data
    });
}

// 批量操作
export const batchShopSubmit = (type: string, data: object) => {
    return request({
        url: "merchant/adminUserShop/batch",
        method: "post",
        data: {type, ...data}
    });
}
// 列表更新项
export const updateShopUserField = (data:object) => {
    return request({
        url: "merchant/adminUserShop/updateField",
        method: "post",
        data
    });
}