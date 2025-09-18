import request from "../../utils/request";
// 获取收货地址列表
export const getAddressList = (params) => {
    return request({
        url: "user/address/list",
        method: "get",
        params
    });
};
// 删除
export const delAddress = (data) => {
    return request({
        url: "user/address/del",
        method: "post",
        data
    });
};
//获取收货地址详情
export const getAddressData = (params) => {
    return request({
        url: "user/address/detail",
        method: "get",
        params
    });
};
// 添加地址
export const addAddressData = (data) => {
    return request({
        url: "user/address/create",
        method: "post",
        data
    });
};
// 更新地址详情
export const updateAddressData = (data) => {
    return request({
        url: "user/address/update",
        method: "post",
        data
    });
};
// 切换地址
export const selectedAddress = (data) => {
    return request({
        url: "user/address/setSelected",
        method: "post",
        data
    });
};
//# sourceMappingURL=address.js.map