import request from "../../utils/request";
export const getUser = () => {
    return request({
        url: "user/user/detail",
        method: "get"
    });
};
export const userClose = () => {
    return request({
        url: "user/user/close",
        method: "post"
    });
};
//# sourceMappingURL=user.js.map