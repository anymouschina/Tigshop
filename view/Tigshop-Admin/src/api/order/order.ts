import request from "@/utils/request";
import { OrderFilterResult, OrderFormState, OrderItem, OrderPrintFormResult, OrderPrintBillFormResult } from "@/types/order/order.d";
// 获取订单列表设置项
export const getOrderPageConfig = () => {
    return request<{isChangeOrderStatus:number}>({
        url: "order/order/getOrderPageConfig",
        method: "get"
    });
};
// 获取订单列表
export const getOrderList = (params: object) => {
    return request<OrderFilterResult>({
        url: "order/order/list",
        method: "get",
        params,
    });
};
// 订单列表页面批量操作
export const batchSubmit = (type: string, data: object) => {
    return request({
        url: "order/order/batch",
        method: "post",
        data: {type, ...data},
    });
};
// 订单列表页面删除项
export const delOrder = (data: object) => {
    return request({
        url: "order/order/delOrder",
        method: "post",
        data,
    });
};
// 订单列表页面更新项
export const updateOrderFiled = (data: object) => {
    return request({
        url: "order/order/updateField",
        method: "post",
        data,
    });
};
// 获取订单详情
export const getOrder = (action: string, params: object) => {
    return request<OrderFormState>({
        url: "order/order/" + action,
        method: "get",
        params,
    });
};

// 获取删除订单
export const operationOrder = (action: string, data: object) => {
    return request<OrderFormState>({
        url: "order/order/" + action,
        method: "post",
        data,
    });
};
export const getShipping = (action: string, params: object) => {
    return request<OrderFormState>({
        url: "order/order/" + action,
        method: "get",
        params,
    });
};
// 更新订单
export const updateOrder = (operation: string, data: object) => {
    return request({
        url: "order/order/" + operation,
        method: "post",
        data,
    });
};
// 修改订单金额
export const modifyOrderMoney = (data: object) => {
    return request({
        url: "order/order/modifyMoney",
        method: "post",
        data,
    });
};

// 修改收货人信息
export const modifyOrderConsignee = (data: object) => {
    return request({
        url: "order/order/modifyConsignee",
        method: "post",
        data,
    });
};
// 修改配送信息
export const modifyOrderShipping = (data: object) => {
    return request({
        url: "order/order/modifyShipping",
        method: "post",
        data,
    });
};
// 添加商品时获取商品信息
export const getAddProductInfoByIds = (data: object) => {
    return request<OrderItem[]>({
        url: "order/order/getAddProductInfo",
        method: "post",
        data,
    });
};

// 修改订单商品
export const modifyOrderProduct = (data: object) => {
    return request({
        url: "order/order/modifyProduct",
        method: "post",
        data,
    });
};

// 获取订单操作日志
export const getOrderLogList = (params: object) => {
    return request<OrderFilterResult>({
        url: "order/orderLog/list",
        method: "get",
        params,
    });
};

// 添加订单操作日志
export const updateOrderLog = (data: object) => {
    return request({
        url: "order/orderLog/create",
        method: "post",
        data,
    });
};

// 添加商家备注
export const setAdminNote = (data: object) => {
    return request({
        url: "order/order/setAdminNote",
        method: "post",
        data,
    });
};

// 确认订单
export const setConfirmOrder = (data: object) => {
    return request({
        url: "order/order/setConfirm",
        method: "post",
        data,
    });
};
// 拆分不同店铺订单
export const splitStoreOrder = (data: object) => {
    return request({
        url: "order/order/splitStoreOrder",
        method: "post",
        data,
    });
};

// 订单已支付
export const setPaidOrder = (data: object) => {
    return request({
        url: "order/order/setPaid",
        method: "post",
        data,
    });
};

// 获取打印订单数据
export const getOrderPrint = (params: object) => {
    return request<OrderPrintFormResult[]>({
        url: "order/order/printSeveral",
        method: "get",
        params,
    });
};

// 获取打印电子面单数据
export const getOrderPrintBill = (params: object) => {
    return request<OrderPrintBillFormResult>({
        url: "order/order/orderPrintBill",
        method: "get",
        params,
    });
};

// 订单已支付
export const orderDeliver = (data: object) => {
    return request({
        url: "order/order/deliver",
        method: "post",
        data,
    });
};
// 批量发货
export const orderDeliverBatch = (data: object) => {
    return request({
        url: "order/order/batch",
        method: "post",
        data,
    });
};

// 获取多个订单详情
export const getSeveralDetail = (params: object) => {
    return request<any>({
        url: "order/order/severalDetail",
        method: "get",
        params,
    });
};
// 获取多个订单详情
export const getShippingInfo = (params: object) => {
    return request<any>({
        url: "order/order/shippingInfo",
        method: "get",
        params,
    });
};

// 修改订单状态
export const changeOrderStatus = (data: object) => {
    return request({
        url: "order/order/changeOrderStatus",
        method: "post",
        data,
    });
};


// 催发货
export const remindDeliver = (params: object) => {
    return request({
        url: "order/order/remindDeliver",
        method: "post",
        params,
    });
};
