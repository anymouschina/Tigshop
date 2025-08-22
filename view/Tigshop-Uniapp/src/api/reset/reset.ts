import request from "@/utils/request";

export const forgetPassword = (data: AnyObject) => {
    return request({
        url: "user/login/forgetPassword",
        method: "post",
        data
    });
};
