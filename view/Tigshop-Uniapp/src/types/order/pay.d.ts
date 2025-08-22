export interface payResponse {
    data: PayData;
    code: number;
    message: string;
}

export interface PayData {
    order: Order;
    paymentList: string[];
    offlinePaymentList: OfflinePaymentList;
}

export interface OfflinePaymentList {
    offlinePayBank: string;
    offlinePayCompany: string;
}

export interface Order {
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
    orderExtension: OrderExtension;
    orderSource: string;
    invoiceData: InvoiceData;
    username: string;
    items: Item[];
    amount?: string;
}

export interface InvoiceData {
    titleType: number;
    invoiceType: number;
    userId: number;
    status: number;
    orderId: number;
}

export interface Item {
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
}

export interface OrderExtension {
    couponMoney: CouponMoney;
    coupon: Coupon;
    shippingFee: number[];
    shippingType: ShippingType[];
}

export interface Coupon {
    "0": number[];
    "1": number[];
}

export interface CouponMoney {
    "0": number;
    "1": number;
}

export interface ShippingType {
    typeId: number;
    typeName: string;
}

export interface creatPayParams {
    id: number;
    type: string;
    code?: number;
}
