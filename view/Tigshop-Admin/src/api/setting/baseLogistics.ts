import request from "@/utils/request";
import type {BaseLogistics} from "@/types/setting/baseLogistics.d";

export const getShippingSettings = () => {
    return request<BaseLogistics>({
        url: 'setting/config/shippingSettings',
        method: 'get'
    });
}

export const updateShippingSettings = (data: BaseLogistics) => {
    return request({
        url: 'setting/config/saveShipping',
        method: 'post',
        data
    });
}

