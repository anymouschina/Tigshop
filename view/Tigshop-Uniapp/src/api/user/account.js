import request from "../../utils/request";
// 账户变动记录
export const getAccountList = (params) => {
    return request({
        url: "user/account/list",
        method: "get",
        params
    });
};
// 申请记录
export const getRechargeOrderList = (params) => {
    return request({
        url: "user/rechargeOrder/list",
        method: "get",
        params
    });
};
export const getDepositList = () => {
    return request({
        url: "user/rechargeOrder/setting",
        method: "get"
    });
};
// 提交充值申请
export const updateRechargeOrder = (data) => {
    return request({
        url: "user/rechargeOrder/update",
        method: "post",
        data
    });
};
// 提现
export const getAccountNoList = (params) => {
    return request({
        url: "user/withdrawApply/list",
        method: "get",
        params
    });
};
export const updateWithdrawApply = (data) => {
    return request({
        url: "user/withdrawApply/apply",
        method: "post",
        data
    });
};
export const delAccount = (params) => {
    return request({
        url: "user/withdrawApply/delAccount",
        method: "post",
        params
    });
};
export const getAccount = (params) => {
    return request({
        url: "user/withdrawApply/accountDetail",
        method: "get",
        params
    });
};
export const updateAccount = (data, url) => {
    return request({
        url: "user/withdrawApply/" + url,
        method: "post",
        data
    });
};
//# sourceMappingURL=account.js.map