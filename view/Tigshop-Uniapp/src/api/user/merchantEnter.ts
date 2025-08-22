import request from "@/utils/request";
import type { ApplyDetailResponse } from "@/types/user/merchantEnter";

export const applyMerchant = (data: object) => {
    return request({
        url: "merchant/merchant/apply",
        method: "post",
        data
    });
};

export const getMerchantInfo = (id: any) => {
    return request<ApplyDetailResponse>({
        url: "merchant/merchant/applyDetail",
        method: "get",
        params: { id }
    });
};

export const getMyMerchant = () => {
    return request<any>({
        url: "merchant/merchant/myApply",
        method: "get"
    });
};

export const getApplyShopAgreement = () => {
    return request({
        url: "merchant/merchant/applyShopAgreement",
        method: "get"
    });
};
