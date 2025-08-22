import request from "@/utils/request";
import type {UserWithdrawApplyFilterParams, UserWithdrawApplyFilterResult, UserWithdrawApplyFormState} from "@/types/finance/userWithdrawApply.d"
// 获取商品分类列表
export const getUserWithdrawApplyList = (params: UserWithdrawApplyFilterParams) => {
    return request<UserWithdrawApplyFilterResult>({
        url: "finance/userWithdrawApply/list",
        method: "get",
        params,
    });
}

// 删除
export const delUserWithdrawApply= (data: object) => {
    return request({
        url: "finance/userWithdrawApply/del",
        method: "post",
        data,
    });
}

export const recallUserWithdrawApply= (data: object) => {
    return request({
        url: "finance/userWithdrawApply/recall",
        method: "post",
        data,
    });
}
//获取分类详情
export const getUserWithdrawApply  = (action: string, params: object) => {
    return request<UserWithdrawApplyFormState>({
        url: "finance/userWithdrawApply/" + action,
        method: "get",
        params
    });
}

// 更新分类
export const updateUserWithdrawApply = (operation: string, data: object) => {
    return request({
        url: "finance/userWithdrawApply/" + operation,
        method: "post",
        data
    });
}

// 批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "finance/userWithdrawApply/batch",
        method: "post",
        data: {type, ...data},
    });
}
