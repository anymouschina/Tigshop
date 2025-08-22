export interface PaymentFormState {


    
    
    
    
    
}

export interface BasicPaySettingsForm {
        useSurplus: number;
        usePoints: number;
        useCoupon: number;
}
export interface WechatPaySettingsForm {
        useWechat: number;
        wechatMchidType: number;
        wechatPayMchid: string;
        wechatPaySubMchid: number;
        wechatPayKey: string;
        wechatPaySerialNo: string;
        wechatPayCertificate: number;
        wechatPayPrivateKey: number;
        wechatPayCheckType: number;
        wechatPayPlatformCertificate: number;
        wechatPayPublicKeyId: number;
        wechatPayPublicKey: number;
        wechatMiniProgramAppId: string;
        wechatMiniProgramSecret: string;
        wechatPayAppId: string;
        wechatPayAppSecret: string;
}
export interface AliPaySettingsForm {
        useAlipay: number;
        alipayAppid: string;
        alipayMobileAppid: string;
        alipayRsaPrivateKey: string;
        alipayRsaPublicKey: string;
}
export interface YaBandPaySettingsForm {
        useYabanpay: number;
        useYabanpayWechat: number;
        useYabanpayAlipay: number;
        yabanpayCurrency: string;
        yabandpayUid: string;
        yabandpaySecretKey: string;
        yabanpayCurrencyList?: YaBandPayCurrency[];
}

export interface OfflinePaySettingsForm {
        useOffline: number;
        offlinePayBank: string;
        offlinePayCompany: string;
}

export interface PayPalSettingsForm {
        usePaypal: number;
        paypalCurrency: string;
        paypalClientId: string;
        paypalSecret: string;
        paypalCurrencyList?: PayPalCurrency[];
}
export interface YunPaySettingsForm {
        useYunpay: number;
        yunpayUid: string;
        yunpaySecretKey: string;
}



export interface YaBandPayCurrency {
    id: number;
    name: string;
    value: string;
}


export interface PayPalCurrency {
    id: number;
    name: string;
    value: string;
}