import * as exp from "constants";

// 列表查询时筛选参数类型
export interface OrderFilterParams {
    page: number;
    size: number;
    sortField?: string;
    sortOrder?: string;
    keyword?: string;
    userId?: number;
    shopId?: number | string;
    orderStatus?: number | string;
    payStatus?: number | string;
    shippingStatus?: number | string;
    address?: string;
    email?: string;
    mobile?: string;
    logisticsId?: number | string;
    isExchangeOrder?: number;
    addTime?: string[];
    addEndTime?: string;
    addStartTime?: string;
    endDate?: string;
    startDate?: string;
    payCode?: number | string;
    isSettlement?: number | string;
    mark?: number | null;
    vendorId?: number | string;
}

// 获取列表返回参数类型
export interface OrderFilterResult {
    records: OrderFilterState[];
    filter: {
        page: number;
    };
    total: number;
}

export interface OrderPrintItems {
    productName: number;
    productSn: string;
    skuSn: string;
    skuValue: string;
    price: number;
    subtotal: number;
    quantity?: number;
}

export interface OrderPrintFormResult {
    username?: string;
    payTime?: string;
    addTime?: string;
    shippingTime?: string;
    preOrderStatus?: string;
    preOrderStatusDesc?: string;
    payTypeName?: string;
    logisticsName?: string;
    orderSn?: string;
    orderSource?: string;
    consignee?: string;
    shippingTypeName?: string;
    trackingNo?: number;
    payTypeId?: number;
    mobile?: number;
    productAmount?: number;
    totalAmount?: number;
    serviceFee?: number;
    shippingFee?: number;
    couponAmount?: number;
    shopName?: string;
    host?: string;
    printTime?: string;
    userAddress?: string;
    user: {
        username?: string;
    };
    address?: {
        telephone?: string;
        address?: string;
        regionName?: string[];
    };
    shop?: {
        shopTitle?: string;
    };
    items: OrderPrintItems[];
}
export interface OrderPrintBillFormResult {
    id?: number;
    orderId?: number;
    orderCode?: string;
    logisticCode?: string;
    addTime?: string;
    orderStatusName?: string;
    printTemplate?: string;
}

export interface OrderFilterState {
    orderId?: number;
    vendorId: number;
    vendorName: string;
    payTypeId?: number;
    addTime?: string;
    checkBox?: boolean;
    orderSn?: string;
    preOrderStatusDesc: string;
    preOrderStatus: number;
    parentOrderId: number;
    isChangeOrderStatus: number;
    shippingStatus: number;
    shopId: number;
    storeTitle?: string;
    orderSource?: string;
    productAmount: number;
    isExchangeOrder?: number;
    userId?: number;
    username?: string;
    consignee?: string;
    mobile?: string;
    payType?: number;
    payStatus?: number;
    logisticsName?: string;
    shippingTypeName?: string;
    shippingFee?: string;
    orderStatus?: number;
    isDel?: number;
    totalAmount?: number;
    status?: number;
    aftersalesSn?: string;
    aftersaleId?: number;
    adminNote?: string;
    orderStatusName?: string;
    items: ItemInfo[];
    availableActions: AvailableActionsInfo;
    mark?: number;
    userAddress: string;
    user: {
        nickname?: string;
        userId?: number;
        username?: string;
    };
    shop: {
        shopTitle?: string;
        shopId?: number;
    };
    payLog: {
        payCode: string;
        transactionId: string;
    }
}
export interface ItemInfo {
    productId?: number;
    picThumb?: string;
    productPicThumb?: string;
    url?: string;
    productName?: string;
    productType?: number;
    price: number;
    quantity?: number;
    aftersalesItem?: {
        aftersalesItemId: number;
        orderItemId: number;
        number: number;
        aftersaleId: number;
    };
}

export interface AvailableActionsInfo {
    cancelOrder?: boolean;
    setConfirm?: boolean;
    confirmReceipt?: boolean;
    modifyOrder?: boolean;
    modifyOrderMoney?: boolean;
    modifyShippingInfo?: boolean;
    setPaid?: boolean;
    setUnpaid?: boolean;
    deliver?: boolean;
    splitOrder?: boolean;
    delOrder?: boolean;
}

export interface OrderFormState {
    orderId?: number;
    shopId?: number;
    mark?: number;
    orderSn?: string;
    addTime?: string;
    parentOrderId?: number;
    isChangeOrderStatus?: number;
    preOrderStatus?: number;
    parentOrderSn?: string;
    orderStatus?: number;
    storeTitle?: string;
    items: OrderItem[];
    username?: string;
    userAddress?: string;
    address?: string;
    consignee?: string;
    email?: string;
    mobile?: string;
    regionData?: number[];
    regionIds?: number[];
    regionName?: string[];
    telephone?: string;
    shippingType?: number;
    shippingMethod?: number;
    shippingTypeId?: number;
    shippingTypeName?: string;
    wayBill?: boolean;
    postcode?: string;
    logisticsId?: number;
    logisticsName?: string;
    payType?: number;
    payTypeId?: number;
    isStoreSplited?: number;
    payTime?: string;
    productAmount: number;
    totalAmount: number;
    couponAmount: number;
    pointsAmount: number;
    invoiceFee?: number;
    serviceFee?: number;
    shippingFee?: number;
    paidAmount: number;
    balance: number;
    discountAmount: number;
    updateOrderSn: number;
    unpaidAmount: number;
    totalProductWeight: number;
    buyerNote?: string;
    adminNote?: string;
    remark?: string;
    availableActions: AvailableActionsInfo;
    shippingTime?: string;
    trackingNo?: string;
    shipping?: number;
    shippingList?: ShippingListType[];
    stepStatus?: StepStatus;
    user?: {
        nickname?: string;
        userId?: number;
        username?: string;
    };
    shop?: {
        shopTitle?: string;
        shopId?: number;
    };
}

export interface StepStatus {
    current: number;
    status: any;
    steps: {
        title?: string;
        description?: string;
    }[];
}

export interface OrderItem {
    itemId: number;
    productId?: number;
    productType: number;
    productName?: number;
    picThumb?: string;
    productSn?: string;
    quantity: number;
    price?: number;
    isDeleted?: number;
    toDeliveryQuantity: number;
    allowDeliverNum: number;
    items?: OrderItem[];
    trackingNo?: string;
    orderSn?: string;
    orderStatus?: number;
}
export interface ShippingListType {
    logisticsId: number;
    logisticsName: string;
    shippingTypeName: string;
    totalFee: string;
    freeMoney: number;
}
export interface ProductOperation {
    description?: string;
}
export interface AddProductInfoByIdsResult {
    item: OrderItem[];
}

export interface OrderToShipFormState {
    items: OrderItem[];
    shippingMethod?: number;
    shippingTypeId?: number;
    logisticsId?: number;
    orderStatus?: number;
    trackingNo?: string;
    billRemark?: string;
}

export interface ShippingInfoTrace {
    action: string;
    acceptTime: string;
    acceptStation: string;
    location: string;
}
