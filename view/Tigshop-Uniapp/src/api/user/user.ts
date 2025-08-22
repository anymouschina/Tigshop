import request from "@/utils/request";
import type { UserDataResponse } from "@/types/user/user";

export const getUser = () => {
    return request<UserDataResponse>({
        url: "user/user/detail",
        method: "get"
    });
};

export const userClose = () => {
    return request<UserDataResponse>({
        url: "user/user/close",
        method: "post"
    });
};
