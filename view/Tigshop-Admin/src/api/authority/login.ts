import request from "@/utils/request";
// 登录
export const adminSignin = (data: object, csrfToken: string) => {
    return request({
        url: "login/signin",
        method: "post",
        data,
        headers: {
            "X-CSRF-Token": csrfToken,
        }
    });
};

// 发送短信验证码
export const sendMobileCode = (data: object) => {
    return request({
        url: "login/sendMobileCode",
        method: "post",
        data,
    });
};
