import request from "@/utils/request";
import type {
    AccountFilterParams,
    AccountDetailFilterResult,
    AccountFilterResult,
    DepositFilterResult,
    AccountInfoResult,
    AccountNoFilterParams,
    AccountFormResult
} from "@/types/user/account";

// 账户变动记录
export const getAccountList = (params?: AccountFilterParams) => {
    return request<AccountDetailFilterResult>({
        url: "user/account/list",
        method: "get",
        params
    });
};

// 申请记录
export const getRechargeOrderList = (params?: AccountFilterParams) => {
    return request<AccountFilterResult>({
        url: "user/rechargeOrder/list",
        method: "get",
        params
    });
};

export const getDepositList = () => {
    return request<DepositFilterResult>({
        url: "user/rechargeOrder/setting",
        method: "get"
    });
};

// 提交充值申请
export const updateRechargeOrder = (data: object) => {
    return request({
        url: "user/rechargeOrder/update",
        method: "post",
        data
    });
};

// 提现
export const getAccountNoList = (params?: AccountNoFilterParams) => {
    return request<AccountInfoResult>({
        url: "user/withdrawApply/list",
        method: "get",
        params
    });
};

export const updateWithdrawApply = (data: object) => {
    return request({
        url: "user/withdrawApply/apply",
        method: "post",
        data
    });
};

export const delAccount = (params: object) => {
    return request({
        url: "user/withdrawApply/delAccount",
        method: "post",
        params
    });
};

export const getAccount = (params?: object) => {
    return request<AccountFormResult>({
        url: "user/withdrawApply/accountDetail",
        method: "get",
        params
    });
};

export const updateAccount = (data: object, url: string) => {
    return request({
        url: "user/withdrawApply/" + url,
        method: "post",
        data
    });
};
