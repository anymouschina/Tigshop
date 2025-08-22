import request from "@/utils/request";
import type { MailFormState} from "@/types/setting/mail";

export const getMailSettings  = () => {
    return request<MailFormState>({
        url: "setting/config/mailSettings",
        method: "get"
    });
}

export const saveMail  = ( data: object) => {
    return request<MailFormState>({
        url: "setting/config/saveMail",
        method: "post",
        data
    });
}

export const sendTestEmail  = (params: object) => {
    return request<object>({
        url: "setting/config/sendTestEmail",
        method: "post",
        params
    });
}
