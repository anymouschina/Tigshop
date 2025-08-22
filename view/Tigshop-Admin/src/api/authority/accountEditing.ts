import type { AdminInfoFormState, UserInfo } from "@/types/authority/accountEditing.d";
import request from "@/utils/request";
const adminType = localStorage.getItem("adminType");

export const getAdminInfo = (params: Object) => {
    return request<AdminInfoFormState>({
        url: adminType=='shop' ? "merchant/adminUserShop/info" : "authority/adminUser/detail",
        method: "get",
        params
    });
};
export const getMineInfo = () => {
    return request<UserInfo>({
        url: "authority/adminUser/mineDetail",
        method: "get"
    });
};
export const getShopInfo = () => {
    return request<any>({
        url: "merchant/shop/currentDetail",
        method: "get"
    });
};
export const LogOut = () => {
    return request<any>({
        url: "user/user/logout",
        method: "post"
    });
};
export const adminInfoSubmit = (data: object) => {
    return request({
        url: adminType=='shop' ? "merchant/adminUserShop/modifyUser" : "authority/adminUser/modifyManageAccounts",
        method: "post",
        data
    });
};
export const modifyManageAccounts = (data: object) => {
    return request({
        url: "authority/adminUser/modifyManageAccounts",
        method: "post",
        data
    });
};
//获取手机验证码
export const getAdminCode = (params: object) => {
    return request({
        url: "authority/adminUser/getCode",
        method: "get",
        params
    });
};
//验证手机验证码
export const setAdminCode = (data: object) => {
    return request({
        url: "adminapi/adminUser/checkCode",
        method: "post",
        data
    });
};
