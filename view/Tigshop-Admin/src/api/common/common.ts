import type {CommonCleanupFormState} from "@/types/common/common.d";
import request from "@/utils/request";

// export const getAdminInfo = (params:Object) => {
//     return request<CommonFilterParams>({
//         url: "authority/adminUser/detail",
//         method: "get",
//         params,
//     });
// }
// export const adminInfoSubmit = (data: object) => {
//     return request({
//         url: "authority/adminUser/modifyManageAccounts",
//         method: "post",
//         data,
//     });
// }

// export const getAdminCode = (params: object) => {
//     return request({
//         url: "authority/adminUser/getCode",
//         method: "get",
//         params,
//     });
// }


export const cleanUp = () => {
    return request<CommonCleanupFormState>({
        url: "common/cacheManage/cleanup",
        method: "post"
    });
}
//统计数据
export const getAdminMsgCount = (params: object) => {
    return request<any>({
        url: "msg/adminMsg/msgCount",
        method: "get",
        params,
    });
}

//页面提示
export const getTipsList = (params: object) => {
    return request<any>({
        url: "common/tipsManage/list",
        method: "get",
        params,
    });
}


// 获取MD5加密token
export const getCsrf = () => {
    return request<any>({
        url: "common/csrf/create",
        method: "get",
    });
}