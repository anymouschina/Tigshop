import request from "@/utils/request";

export const userSignin = (data: any, header = {}) => {
    return request({
        url: "user/login/signin",
        method: "post",
        data,
        header
    });
};

export const csrfCreate = () => {
    return request({
        url: "common/csrf/create",
        method: "get"
    });
};

export const userLogout = () => {
    return request({
        url: "user/user/logout",
        method: "post"
    });
};

export const sendMobileCode = (data: object) => {
    return request({
        url: "user/login/sendMobileCode",
        method: "post",
        data
    });
};

export const sendEmailCode = (data: object) => {
    return request({
        url: "user/login/sendEmailCode",
        method: "post",
        data
    });
};

export const getWechartMobile = (data: any) => {
    return request({
        url: "user/login/getMobile",
        method: "post",
        data
    });
};

export const setMiniProgramOpenid = (data: any) => {
    return request({
        url: "user/login/updateUserOpenid",
        method: "post",
        data
    });
};

export const getOauthUrl = (params: any) => {
    return request({
        url: "user/login/getWxLoginUrl",
        method: "get",
        params
    });
};

export const getOauthInfo = (params: any) => {
    return request({
        url: "user/login/getWxLoginInfoByCode",
        method: "get",
        params
    });
};

export const bindWechat = (data: any) => {
    return request({
        url: "user/login/bindWechat",
        method: "post",
        data
    });
};

export const unbindWechat = () => {
    return request({
        url: "user/login/unbindWechat",
        method: "get"
    });
};

export const checkMobile = (data: AnyObject) => {
    return request({
        url: "user/login/checkMobile",
        method: "post",
        data
    });
};
export const checkEmail = (data: AnyObject) => {
    return request({
        url: "user/login/checkEmail",
        method: "post",
        data
    });
};

export const getOauth = (path: string, redirectUri: string) => {
    return request({
        url: `user/oauth/render/${path}?redirectUri=${redirectUri}`,
        method: "get"
    });
};

export const getOauthCallback = (path: string, redirectUri: string, data: object) => {
    return request({
        url: `user/oauth/callback/${path}?redirectUri=${redirectUri}`,
        method: "post",
        data
    });
};
