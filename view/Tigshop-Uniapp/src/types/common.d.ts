export interface GuessLikeDataResponse {
    data: ProductList[];
    code: number;
    message: string;
}

export interface GuessLikeIdsDataResponse {
    data: string;
    code: number;
    message: string;
}

export interface GuessLikeProductList {
    productId: number;
    picThumb: string;
    picUrl: string;
    productName: string;
    checkStatus: number;
    shopId: number;
    suppliersId: number;
    productType: number;
    productSn: string;
    productPrice: string;
    marketPrice: string;
    productStatus: number;
    isBest: number;
    isNew: number;
    isHot: number;
    productStock: number;
    sortOrder: number;
    seckillPrice: null;
    productSku: ProductSku[];
}

export interface GuessLikeProductSku {
    skuId: number;
    productId: number;
    skuValue: string;
    skuData: SkuDatum[];
    skuSn: string;
    skuStock: number;
    skuTsn: string;
    skuPrice: string;
}

export interface GuessLikeSkuDatum {
    name: string;
    value: string;
}

// 主题

export interface ConfigResponse {
    data: ThemeData;
    code: number;
    message: string;
}

export interface ConfigData {
    shopName: string;
    shopTitle: string;
    shopTitleSuffix: string;
    shopLogo: string;
    shopKeywords: string;
    shopDesc: string;
    storageUrl: string;
    dollarSign: string;
    dollarSignCn: string;
    icoImg: string;
    pcDomain: string;
    h5Domain: string;
    adminDomain: string;
    decoratePageConfig: DecoratePageConfig;
    code: number;
    message: string;
    openWechatOauth: number;
    showService: boolean;
    isEnterprise: number | string;
    deCopyright: number | string;
    number: string;
    poweredByStatus: number | null;
    shopCompany: string;
    categoryDecorateType: number;
    canInvoice: number;
    invoiceAdded: number;
    dollarSign: string;
    isOpenMobileAreaCode: number;
    showMarketprice: number;
    showSelledCount: number;
    companyDataType: number;
    companyDataTips: string;
    isIdentity: number;
    shopRegClosed: number;
    closeOrder: number;
    useCoupon: number;
    usePoints: number;
    useSurplus: number;
    googleLoginOn: number;
    facebookLoginOn: number;
    defaultTechSupport: string;
    poweredByLogo: string;
    openEmailRegister: number;
    integralName: string;
}

export interface DecoratePageConfig {
    type: string;
    module: any[];
    backgroundRepeat: string;
    backgroundSize: string;
    style: number;
    title: string;
    titleColor: string;
    titleBackgroundColor: string;
    backgroundImage: BackgroundImage;
    backgroundColor: string;
    headerStyle: number;
    logo: BackgroundImage;
    active: boolean;
}

export interface BackgroundImage {
    picUrl: string;
    picThumb: string;
}

export interface ThemeResponse {
    data: {
        themeStyle: string;
    };
    code: number;
    message: string;
}
export interface LangListResponse {
    data: LangListItem[];
    code: number;
    message: string;
}

export interface LangListItem {
    id: number;
    localeCode: string;
    language: string;
    flagPicture: string;
    lastUpdated: string;
    isEnabled: number;
    isDefault: number;
}

export interface DefaultLangResponse {
    data: DefaultLangItem;
    code: number;
    message: string;
}
export interface DefaultLangItem {
    id: number;
    localeCode: string;
    language: string;
    flagPicture: string;
    lastUpdated: string;
    isEnabled: number;
    isDefault: number;
}

export interface CurrencyResponse {
    data: CurrencyItem[];
    code: number;
    message: string;
}

export interface CurrencyItem {
    id: number;
    name: string;
    symbol: string;
    localesId: number;
    isDefault: number;
    rate: string;
}

export interface MobileAreaCodeResponse {
    data: MobileAreaCodeList[];
    code: number;
    message: string;
}

export interface MobileAreaCodeList {
    id: number;
    code: string;
    name: string;
    isAvailable: number;
    isDefault: number;
    label: string;
    labelName: string;
}

export interface ProductsListResponse {
    data: ProductsListData;
    code: number;
    message: string;
}

export interface ProductsListData {
    records: ProductsListResult[];
    total: number;
}

export interface Filter {
    isShow: number;
    page: number;
    size: number;
    sortField: string;
    sortOrder: string;
    productId: number;
    isDelete: number;
    categoryId: number;
    brandId: number;
    ids: null;
    shopId: number;
    introType: string;
    couponId: number;
    shopCategoryId: number;
    withCartSum: number;
    productStatus: number;
}

export interface ProductsListResult {
    categoryId: number;
    brandId: number;
    productTsn: string;
    marketPrice: string;
    shippingTplId: number;
    freeShipping: number;
    productId: number;
    picUrl: string;
    picThumb: string;
    productName: string;
    checkStatus: number;
    checkReason: string;
    shopId: number;
    suppliersId: number;
    productType: number;
    productSn: string;
    productPrice: string;
    productStatus: number;
    isBest: number;
    isNew: number;
    isHot: number;
    productStock: number;
    sortOrder: number;
    productSku: ProductSku[];
    shop: ShopSimple | null;
}

export interface ProductSku {
    skuId: number;
    productId: number;
    skuValue: string;
    skuData: SkuDatum[];
    skuSn: string;
    skuStock: number;
    skuTsn: string;
    skuPrice: string;
}

export interface SkuDatum {
    name: string;
    value: string;
}

export interface ShopSimple {
    statusText: string;
    shopId: number;
    shopTitle: string;
}
