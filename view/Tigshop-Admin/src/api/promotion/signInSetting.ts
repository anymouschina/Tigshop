import request from "@/utils/request";
import { SignInSettingFilterResult, SignInSettingFormState } from "@/types/promotion/signInSetting.d";
// 获取签到设置列表
export const getSignInSettingList = (params: object) => {
    return request<SignInSettingFilterResult>({
        url: "promotion/signInSetting/list",
        method: "get",
        params,
    });
}
// 获取签到设置详情
export const getSignInSetting = (action: string, params: object) => {
    return request<SignInSettingFormState>({
        url: "promotion/signInSetting/" + action,
        method: "get",
        params
    });
}
// 更新签到设置
export const updateSignInSetting = (operation: string, data: object) => {
    return request({
        url: "promotion/signInSetting/" + operation,
        method: "post",
        data
    });
}
