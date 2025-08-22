import request from "@/utils/request";

export const bindMobilePhone = (data: any) => {
    return request({
        url: "user/login/bindMobile",
        method: "post",
        data
    });
};
