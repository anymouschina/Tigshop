import request from "@/utils/request";
import type { PaymentFormState, BasicPaySettingsForm, WechatPaySettingsForm, AliPaySettingsForm, YaBandPaySettingsForm, OfflinePaySettingsForm, PayPalSettingsForm, YunPaySettingsForm } from "@/types/setting/payment.d";

export const getPaymentSettings = () => {
    return request<PaymentFormState>({
        url: 'setting/config/paySettings',
        method: 'get'
    });
}

export const updatePaymentSettings = (data: PaymentFormState) => {
    return request({
        url: 'setting/config/savePay',
        method: 'post',
        data
    });
}

//支付基础设置
export const getBasicSettings = () => {
    return request<BasicPaySettingsForm>({
        url: 'setting/config/basicPaySettings',
        method: 'get'
    });
}
export const updateBasicSettings = (data: BasicPaySettingsForm) => {
    return request({
        url: 'setting/config/saveBasicPay',
        method: 'post',
        data
    });
}

//微信支付设置
export const getWechatSettings = () => {
    return request<WechatPaySettingsForm>({
        url: 'setting/config/wechatPaySettings',
        method: 'get'
    });
}
export const updateWechatSettings = (data: WechatPaySettingsForm) => {
    return request({
        url: 'setting/config/saveWechatPay',
        method: 'post',
        data
    });
}

//支付宝支付设置
export const getAliPaySettings = () => {
    return request<AliPaySettingsForm>({
        url: 'setting/config/aliPaySettings',
        method: 'get'
    });
}
export const updateAliPaySettings = (data: AliPaySettingsForm) => {
    return request({
        url: 'setting/config/saveAliPay',
        method: 'post',
        data
    });
}

//YaBandPay支付设置
export const getYaBandPaySettings = () => {
    return request<YaBandPaySettingsForm>({
        url: 'setting/config/yaBandPaySettings',
        method: 'get'
    });
}
export const updateYaBandPaySettings = (data: YaBandPaySettingsForm) => {
    return request({
        url: 'setting/config/saveYaBandPay',
        method: 'post',
        data
    });
}

//线下支付设置
export const getOfflinePaySettings = () => {
    return request<OfflinePaySettingsForm>({
        url: 'setting/config/offlinePaySettings',
        method: 'get'
    });
}
export const updateOfflinePaySettings = (data: OfflinePaySettingsForm) => {
    return request({
        url: 'setting/config/saveOfflinePay',
        method: 'post',
        data
    });
}

//PayPal支付设置
export const getPayPalSettings = () => {
    return request<PayPalSettingsForm>({
        url: 'setting/config/payPalSettings',
        method: 'get'
    });
}
export const updatePayPalSettings = (data: PayPalSettingsForm) => {
    return request({
        url: 'setting/config/savePayPal',
        method: 'post',
        data
    });
}

//云支付支付设置
export const getYunPaySettings = () => {
    return request<YunPaySettingsForm>({
        url: 'setting/config/yunPaySettings',
        method: 'get'
    });
}
export const updateYunPaySettings = (data: YunPaySettingsForm) => {
    return request({
        url: 'setting/config/saveYunPay',
        method: 'post',
        data
    });
}


export const createPlatformCertificate = () => {
    return request({
        url: "setting/config/createPlatformCertificate",
        method: "post"
    });
};
