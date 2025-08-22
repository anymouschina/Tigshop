import request from "@/utils/request";
import type { SignInfoResponse } from "@/types/user/sign.d";

export const getSignList = (url: string) => {
    return request<SignInfoResponse>({
        url: url,
        method: "get"
    });
};

export const signIn = () => {
    return request<SignInfoResponse>({
        url: "user/sign/sign",
        method: "get"
    });
};
