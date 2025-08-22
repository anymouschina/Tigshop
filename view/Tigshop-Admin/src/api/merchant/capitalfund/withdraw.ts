import request from "@/utils/request";
import type {WithdrawFilterResult, WithdrawFormResult} from "@/types/merchant/capitalfund/withdraw.d";
// 获取商家提现列表
export const getWithdrawList = (params: object) => {
    return request<WithdrawFilterResult>({
        url: "merchant/shopWithdraw/list",
        method: "get",
        params,
    });
}
// 获取商家提现配置
export const getWithdrawConfig = () => {
    return request<any>({
        url: "merchant/shopWithdraw/config",
        method: "get"
    });
}
// 创建提现
export const createWithdraw = (data: object) => {
    return request({
        url: "merchant/shopWithdraw/create",
        method: "post",
        data
    });
}

// 审核提现(管理后台专用)
export const auditWithdraw = (data: object) => {
    return request({
        url: "merchant/shopWithdraw/audit",
        method: "post",
        data
    });
}


// 上传支付凭证(管理后台专用)
export const uploadPayVoucher = (data: object) => {
    return request({
        url: "merchant/shopWithdraw/uploadPayVoucher",
        method: "post",
        data
    });
}

// 审核提现详情(管理后台专用)
export const getWithdrawDetail = (params: object) => {
    return request<any>({
        url: "merchant/shopWithdraw/detail",
        method: "get",
        params
    });
}