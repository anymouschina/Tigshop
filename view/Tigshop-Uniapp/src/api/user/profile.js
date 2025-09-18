import request from "../../utils/request";
export const getProfile = () => {
    return request({
        url: "user/user/detail",
        method: "get"
    });
};
// 更新个人信息
export const updateProfile = (data) => {
    return request({
        url: "user/user/updateInformation",
        method: "post",
        data
    });
};
//# sourceMappingURL=profile.js.map