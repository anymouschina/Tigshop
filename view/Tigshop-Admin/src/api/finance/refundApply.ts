import request from "@/utils/request";
import type {RefundApplyFilterParams, RefundApplyFilterResult, RefundApplyFormState} from "@/types/finance/refundApply.d"
// 获取退款申请
export const getRefundApplyList = (params: RefundApplyFilterParams) => {
    return request<RefundApplyFilterResult>({
        url: "finance/refundApply/list",
        method: "get",
        params,
    });
}

// 获取退款申请config
export const getRefundApplyConfig = () => {
    return request<any>({
        url: "finance/refundApply/config",
        method: "get"
    });
}

// 删除
export const delRefundApply= (data: object) => {
    return request({
        url: "finance/refundApply/del",
        method: "post",
        data,
    });
}


//获取退款申请详情
export const getRefundApply  = (action: string, params: object) => {
    return request<RefundApplyFormState>({
        url: "finance/refundApply/" + action,
        method: "get",
        params
    });
}

// 更新退款申请
export const updateRefundApply = (data: object) => {
    return request({
        url: "finance/refundApply/audit",
        method: "post",
        data
    });
}

// 批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "finance/refundApply/batch",
        method: "post",
        data: {type, ...data},
    });
}

// 确认线下转账
export const updateOfflineAudit = (data: object) => {
    return request({
        url: "finance/refundApply/offlineAudit",
        method: "post",
        data
    });
}