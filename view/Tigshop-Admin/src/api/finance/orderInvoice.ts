import request from "@/utils/request";
import type {OrderInvoiceFilterParams, OrderInvoiceFilterResult, OrderInvoiceFormState} from "@/types/finance/orderInvoice.d"
// 获取商品分类列表
export const getOrderInvoiceList = (params: OrderInvoiceFilterParams) => {
    return request<OrderInvoiceFilterResult>({
        url: "finance/orderInvoice/list",
        method: "get",
        params,
    });
}

// 删除
export const delOrderInvoice= (data: object) => {
    return request({
        url: "finance/orderInvoice/del",
        method: "post",
        data,
    });
}

export const recallOrderInvoice= (data: object) => {
    return request({
        url: "finance/orderInvoice/recall",
        method: "post",
        data,
    });
}
//获取分类详情
export const getOrderInvoice  = (action: string, params: object) => {
    return request<OrderInvoiceFormState>({
        url: "finance/orderInvoice/" + action,
        method: "get",
        params
    });
}

// 更新分类
export const updateOrderInvoice = (operation: string, data: object) => {
    return request({
        url: "finance/orderInvoice/" + operation,
        method: "post",
        data
    });
}

// 批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "finance/orderInvoice/batch",
        method: "post",
        data: {type, ...data},
    });
}
