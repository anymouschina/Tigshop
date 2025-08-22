export interface OrderNumResponse {
    data: Item;
    code: number;
    message: string;
}

export interface OrderNumItem {
    awaitPay: number;
    awaitShipping: number;
    awaitReceived: number;
    awaitComment: number;
    orderCompleted: number;
    productCollect: number;
    shopCollect: number;
}

export interface OrderListFilterParams {
    page: number;
    size: number;
    orderStatus: number;
    commentStatus: number;
}

export interface OrderListResponse {
    data: OrderListData;
    code: number;
    message: string;
}

export interface OrderListData {
    records: OrderListFilterResult[];
    total: number;
}

export interface OrderListFilter {
    keyword: string;
    orderStatus: number;
    payStatus: number;
    shippingStatus: number;
    commentStatus: number;
    dateType: number;
    page: number;
    size: number;
    sortField: string;
    sortOrder: string;
    userId: number;
}

export interface OrderListFilterResult {
    orderStatusName: string;
    userAddress: string;
    shippingStatusName: string;
    payStatusName: string;
    orderId: number;
    orderSn: string;
    userId: number;
    parentOrderId: number;
    parentOrderSn: string;
    orderStatus: number;
    shippingStatus: number;
    payStatus: number;
    addTime: string;
    consignee: string;
    address: string;
    regionIds: number[];
    regionNames: string[];
    addressData: null;
    mobile: string;
    email: string;
    buyerNote: string;
    adminNote: string;
    shippingMethod: number;
    logisticsId: number;
    logisticsName: string;
    shippingTypeId: number;
    shippingTypeName: string;
    trackingNo: string;
    shippingTime: string;
    receivedTime: string;
    payTypeId: number;
    payTime: string;
    usePoints: number;
    distributionStatus: number;
    promoterUserId: number;
    isDel: number;
    shopId: number;
    shopTitle: string;
    isStoreSplited: number;
    commentStatus: number;
    totalAmount: string;
    paidAmount: string;
    unpaidAmount: string;
    unrefundAmount: string;
    productAmount: string;
    couponAmount: string;
    pointsAmount: string;
    discountAmount: string;
    balance: string;
    onlinePaidAmount: string;
    offlinePaidAmount: string;
    serviceFee: string;
    shippingFee: string;
    invoiceFee: string;
    orderExtension: OrderListExtension;
    orderSource: string;
    invoiceData: InvoiceData;
    outTradeNo: string;
    username: string;
    availableActions: { [key: string]: boolean };
    items: OrderListItem[];
    autoDeliveryDays: number | null;
    shop: Shop;
}
export interface Shop {
    description: string;
    kefuInlet: any;
    kefuLink: string;
    kefuPhone: string;
    shopId: number;
    shopTitle: string;
    statusText: string;
}

export interface OrderListInvoiceData {
    invoiceType: number;
    titleType: number;
    companyCode?: string;
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyBank?: string;
    companyAccount?: string;
    invoiceContent?: string;
    amount?: number | string;
    mobile?: string;
    email?: string;
    userId: number;
    status: number;
    orderId: number;
    orderSn?: string;
    invoicingTime?: string;
    addTime?: string;
    invoiceAttachment: InvoiceAttachment[]
}

export interface OrderListItem {
    itemId: number;
    orderId: number;
    orderSn: string;
    userId: number;
    price: string;
    quantity: number;
    productId: number;
    productName: string;
    productSn: string;
    picThumb: string;
    skuId: number;
    skuData: OrderListSkuDatum[];
    deliveryQuantity: number;
    productType: number;
    isGift: number;
    shopId: number;
    isPin: number;
    prepayPrice: string;
    productPicThumb: string;
    productStock: number;
    productWeight: string;
    skuStock: number | null;
    skuSn: null | string;
    skuValue: null | string;
    aftersalesItem: null;
}

export interface OrderListSkuDatum {
    name: string;
    value: string;
}

export interface OrderListExtension {
    couponMoney?: number[] | OrderListCouponMoneyClass;
    coupon?: Array<number[]> | OrderListCouponClass;
    shippingFee: number[];
    shippingType: OrderListShippingType[];
}

export interface OrderListCouponClass {
    "0"?: number[];
    "1": number[];
}

export interface OrderListCouponMoneyClass {
    "0"?: number;
    "1": number;
}

export interface OrderListShippingType {
    typeId: number;
    typeName: string;
}

/* 详情 */
export interface OrderInfoResponse {
    data: OrderInfoResponseItem;
    code: number;
    message: string;
}

export interface OrderInfoResponseItem {
    orderStatusName: string;
    userAddress: string;
    shippingStatusName: string;
    payStatusName: string;
    orderId: number;
    orderSn: string;
    userId: number;
    parentOrderId: number;
    parentOrderSn: string;
    orderStatus: number;
    shippingStatus: number;
    payStatus: number;
    addTime: string;
    consignee: string;
    address: string;
    regionIds: number[];
    regionNames: string[];
    addressData: null;
    mobile: string;
    email: string;
    buyerNote: string;
    adminNote: string;
    shippingMethod: number;
    logisticsId: number;
    logisticsName: string;
    shippingTypeId: number;
    shippingTypeName: string;
    trackingNo: string;
    shippingTime: string;
    receivedTime: string;
    payTypeId: number;
    payTime: string;
    usePoints: number;
    distributionStatus: number;
    promoterUserId: number;
    isDel: number;
    shopId: number;
    shopTitle: string;
    isStoreSplited: number;
    commentStatus: number;
    totalAmount: string;
    paidAmount: string;
    unpaidAmount: number;
    unrefundAmount: string;
    productAmount: number;
    couponAmount: number;
    pointsAmount: number;
    discountAmount: number;
    balance: number;
    onlinePaidAmount: string;
    offlinePaidAmount: string;
    serviceFee: string;
    shippingFee: number;
    invoiceFee: string;
    orderExtension: OrderInfoExtension;
    orderSource: string;
    invoiceData: OrderInfoInvoiceData;
    outTradeNo: string;
    username: string;
    availableActions: { [key: string]: boolean };
    stepStatus: OrderInfoStepStatus;
    items: OrderInfoItemElement[];
    orderType: number;
    shop: Shop;
    autoDeliveryDays: number | null;
}

export interface EcardItem {
    cardId: number;
    groupId: number;
    cardNumber: string;
    cardPwd: string;
    orderItemId: number;
}

export interface OrderInfoInvoiceData {
    titleType: number;
    invoiceType: number;
    userId: number;
    status: number;
    orderId: number;
}

export interface OrderInfoItemElement {
    itemId: number;
    orderId: number;
    orderSn: string;
    userId: number;
    price: string;
    quantity: number;
    productId: number;
    productName: string;
    productSn: string;
    picThumb: string;
    skuId: number;
    skuData: any[];
    deliveryQuantity: number;
    productType: number;
    isGift: number;
    shopId: number;
    isPin: number;
    prepayPrice: string;
    productPicThumb: string;
    productStock: number;
    productWeight: string;
    skuStock: null;
    skuSn: null;
    skuValue: null;
    stock: number;
    subtotal: number;
    aftersalesItem: any;
    virtualSample: string;
    eCard: EcardItem[];
    extraSkuData: any[];
}
export interface Shop {
    description: string;
    kefuInlet: any;
    kefuLink: string;
    kefuPhone: string;
    shopId: number;
    shopTitle: string;
    statusText: string;
}

export interface OrderInfoExtension {
    couponMoney: OrderInfoCouponMoney;
    coupon: OrderInfoCoupon;
    shippingFee: number[];
    shippingType: OrderInfoShippingType[];
}

export interface OrderInfoCoupon {
    "1": number[];
}

export interface OrderInfoCouponMoney {
    "1": number;
}

export interface OrderInfoShippingType {
    typeId: number;
    typeName: string;
}

export interface OrderInfoStepStatus {
    current: number;
    status: string;
    steps: Step[];
}

export interface OrderInfoStep {
    title: string;
    description: string;
}

export interface ShippingInfoResponse {
    data: ShippingInfoData;
    code: number;
    message: string;
}

export interface ShippingInfoData {
    shipperCode: string;
    logisticCode: string;
    state: string;
    stateEx: string;
    location: string;
    traces: ShippingInfoTrace[];
    success: string;
    ebusinessID: string;
}

export interface ShippingInfoTrace {
    action: string;
    acceptTime: string;
    acceptStation: string;
    location: string;
}

export interface InvoiceAttachment {
    picId: number;
    picName: string;
    picThumb: string;
    picUrl: string;
}
