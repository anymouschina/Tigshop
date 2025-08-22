export interface CheckResponse {
    code: number;
    message: string;
    data: CheckItem;
}
export interface CheckItem {
    addressList: AddressList[];
    availablePaymentType: AvailablePaymentType[];
    storeShippingType: Array<StoreShippingType[]>;
    cartList: CartList[];
    total: Total;
    balance: number;
    points: number;
    availablePoints: number;
    couponList: CouponList;
    item: Item;
    code: number;
    message: string;
    tmplIds: [];
    useCouponIds: number[];
    selectUserCouponIds: number[];
}

export interface AddressList {
    regionName: string;
    addressId: number;
    addressTag: string;
    userId: number;
    consignee: string;
    email: string;
    regionIds: number[];
    regionNames: string[];
    address: string;
    postcode: string;
    telephone: string;
    mobile: string;
    isDefault: number;
    isSelected: number;
}

export interface AvailablePaymentType {
    typeId: number;
    typeName: string;
    disabled: boolean;
    disabledDesc: string;
    isShow: boolean;
}

export interface CartList {
    shopId: number;
    shopTitle: string;
    noShipping: number;
    carts: Cart[];
    gift: any[];
}

export interface Cart {
    cartId: number;
    userId: number;
    productId: number;
    productSn: string;
    productName: string;
    picThumb: string;
    marketPrice: string;
    originalPrice: string;
    originPrice: string;
    quantity: number;
    skuId: number;
    skuData: any[];
    productType: number;
    isChecked: boolean;
    shopId: number;
    type: number;
    shopTitle: null;
    productWeight: string;
    shippingTplId: number;
    freeShipping: number;
    productStatus: number;
    price: string;
    stock: number;
    subtotal: number;
    isDisabled: boolean;
    activityInfo?: any;
    extraSkuData?: ExtraSkuData[];
    extraSkuAllData?: {
        extra: Extra[];
    };
}
export interface ExtraSkuData {
    attrName: string;
    attrValue: string;
    attrPrice: string;
    attributesId: number;
}

export interface Extra {
    attrName: string;
    attrList: ExtraSkuData[];
}

export interface CouponList {
    enableCoupons: EnableCoupon[];
    disableCoupons: DisableCoupon[];
}

export interface DisableCoupon {
    id: number;
    couponName: string;
    minOrderAmount: string;
    couponDesc: string;
    couponType: number;
    couponMoney: string;
    isGlobal: number;
    couponDiscount: number;
    shopId: number;
    endDate: string;
    couponId: number;
    disableReason: string;
    disabled: boolean;
    selected: boolean;
}

export interface EnableCoupon {
    id: number;
    couponName: string;
    couponDesc: string;
    minOrderAmount: string;
    couponType: number;
    couponMoney: number | string;
    isGlobal: number;
    couponDiscount: number;
    shopId: number;
    endDate: string;
    couponId: number;
    disableReason: string;
    disabled: boolean;
    selected: boolean;
    userCouponId: number;
}

export interface Item {
    addressId: number;
    shippingType: ShippingType[];
    payTypeId: number;
    usePoint: number;
    useBalance: number;
    useCouponIds: number[];
}

export interface ShippingType {
    typeId: number;
    shopId: number;
    typeName: string;
}

export interface StoreShippingType {
    shippingTypeId: number;
    shippingTypeName: string;
    shippingDefaultId: number;
    shippingTypeDesc: string;
    shippingTimeDesc: string;
    isSupportCod: number;
    sortOrder: number;
    shopId: number;
}

export interface Total {
    productAmount: number;
    checkedCount: number;
    discounts: number;
    discountAfter: number;
    totalCount: number;
    discountCouponAmount: number;
    discountSeckillAmount: number;
    discountProductPromotionAmount: number;
    discountTimeDiscountAmount: number;
    pointsAmount: number;
    shippingFee: number;
    storeShippingFee: number[];
    totalAmount: number;
    balance: number;
    unpaidAmount: number;
    orderSendPoint: number;
    exchangePoints?: number;
}

export interface PaymentTypeResponse {
    code: number;
    message: string;
    data: PaymentTypeItem[];
}

export interface PaymentTypeItem {
    typeId: number;
    typeName: string;
    disabled: boolean;
    disabledDesc: string;
    isShow: boolean;
}

export interface ShippingTypeResponse {
    code: number;
    message: string;
    data: { [key: string]: ShippingTypeItem[] };
}

export interface ShippingTypeItem {
    shippingTypeId: number;
    shippingTypeName: string;
    shippingDefaultId: number;
    shippingTypeDesc: string;
    shippingTimeDesc: string;
    isSupportCod: number;
    sortOrder: number;
    shopId: number;
}
