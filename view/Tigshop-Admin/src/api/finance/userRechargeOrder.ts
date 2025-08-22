import request from "@/utils/request";
import type {UserRechargeOrderFilterParams, UserRechargeOrderFilterResult, UserRechargeOrderFormState} from "@/types/finance/userRechargeOrder.d"
// 获取商品分类列表
export const getUserRechargeOrderList = (params: UserRechargeOrderFilterParams) => {
    return request<UserRechargeOrderFilterResult>({
        url: "finance/userRechargeOrder/list",
        method: "get",
        params,
    });
}

// 删除
export const delUserRechargeOrder= (data: object) => {
    return request({
        url: "finance/userRechargeOrder/del",
        method: "post",
        data,
    });
}

export const recallUserRechargeOrder= (data: object) => {
    return request({
        url: "finance/userRechargeOrder/recall",
        method: "post",
        data,
    });
}
//获取分类详情
export const getUserRechargeOrder  = (action: string, params: object) => {
    return request<UserRechargeOrderFormState>({
        url: "finance/userRechargeOrder/" + action,
        method: "get",
        params
    });
}

// 更新分类
export const updateUserRechargeOrder = (operation: string, data: object) => {
    return request({
        url: "finance/userRechargeOrder/" + operation,
        method: "post",
        data
    });
}

// 批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "finance/userRechargeOrder/batch",
        method: "post",
        data: {type, ...data},
    });
}
