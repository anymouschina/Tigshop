import request from "@/utils/request";

// 订单电子发票申请添加
export const orderInvoiceInsert = (data: object) => {
    return request({
        url: "user/orderInvoice/create",
        method: "post",
        data
    });
};

// 编辑
export const orderInvoiceUpdate = (data: object) => {
    return request({
        url: "user/orderInvoice/update",
        method: "post",
        data
    });
};

/**    增票资质          */
export const getUserInvoice = () => {
    return request<any>({
        url: "user/invoice/detail",
        method: "get"
    });
};

export const createUserInvoice = (data: object) => {
    return request({
        url: "user/invoice/create",
        method: "post",
        data
    });
};

export const updateUserInvoice = (data: object) => {
    return request<any>({
        url: "user/invoice/update",
        method: "post",
        data
    });
};

export const getInvoiceStatus = () => {
    return request<any>({
        url: "user/invoice/getStatus",
        method: "get"
    });
};
