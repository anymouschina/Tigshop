import request from "../../utils/request";
// 申请数据
export const getAftersalesEdit = (params) => {
    return request({
        url: "user/aftersales/applyData",
        method: "get",
        params
    });
};
// 售后选项
export const getAftersalesConfig = () => {
    return request({
        url: "user/aftersales/config",
        method: "get"
    });
};
export const updateAfterSales = (data) => {
    return request({
        url: "user/aftersales/create",
        method: "post",
        data
    });
};
// 修改售后详情
export const aftersalesUpdate = (data) => {
    return request({
        url: "user/aftersales/update",
        method: "post",
        data
    });
};
// 售后记录详情
export const aftersalesViewRecord = (id) => {
    return request({
        url: "user/aftersales/detail?id=" + id,
        method: "get"
    });
};
// 售后申请撤销
export const aftersalesCancel = (data) => {
    return request({
        url: "user/aftersales/cancel",
        method: "post",
        data
    });
};
// 售后log
export const viewRecordLog = (id) => {
    return request({
        url: "user/aftersales/detailLog?id=" + id,
        method: "get"
    });
};
//  提交售后反馈记录
export const aftersalesFeedback = (data) => {
    return request({
        url: "user/aftersales/feedback",
        method: "post",
        data
    });
};
// 售后申请记录
export const aftersalesRecord = (params) => {
    return request({
        url: "user/aftersales/getRecord",
        method: "get",
        params
    });
};
//# sourceMappingURL=afterSale.js.map