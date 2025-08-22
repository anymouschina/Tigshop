import request from "@/utils/request";

export const userRegist = (data: {}) => {
    return request({
        url: "user/regist/registAct",
        method: "post",
        data
    });
};
