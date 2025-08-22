// 列表查询时筛选参数类型
import type {SeckillProductState} from "@/types/promotion/seckill";

export interface ProductFilterParams {
    page?: number;
    size?: number;
    sortField?: string,
    sortOrder?: string,
    keyword?: string;
    shopId?: number | string;
    categoryId?: number | string;
    brandId?: number | string;
    introType?: string;
    productStatus?: number;
    checkStatus?: number;
    isDelete?: number;
    searchShop?: number;
    searchStartTime?: string;
    searchEndTime?: string;
    ids?: string;
}

// 获取列表返回参数类型
export interface ProductFilterState {
    productId: number;
    shippingTplId: any;
    productName: string;
    productSn: string;
    url: string;
    picThumb: string;
    brandName: string;
    storeTitle: string;
    type: number;
    suppliersName: string;
    checkStatus: number;
    productPrice?: number;
    status: number;
    isBest: number;
    isNew: number;
    isHot: number;
    productStock: number;
    productExist: number;
    sortOrder: number;
    ids: number[];
    skuIds?: number[];
    check?: boolean;
    productSku: any[];
    vendorProductId: number;
}
export interface ProductFilterResult {
    records: ProductFilterState[];
    filter: ProductFilterParams;
    total: number;
    waitingCheckedCount: number;
}


// 获取详情返回参数类型
export interface ProductFormState {
    productType?: number;
    snType?: number;
    shopCategoryId?: number;
    productId?: string;
    picThumb?: string;
    productName?: string;
    imgList?: Array<ImgListItem>;
    productVideoInfo?: any[];
    productStock?: number;
    categoryId?: number | string;
    productBrief?: string;
    productPrice?: number;
    marketPrice?: number;
    productSn?: string;
    productTsn?: string;
    brandId?: number | string;
    vendorId?: number | string;
    suppliersList?: SuppliersListType[];
    suppliersId?: number;
    shippingTplId?: number | string;
    shippingTplList?: ShippingTplListType[];
    freeShipping?: number;
    seckillMaxNum?: number;
    productStatus?: number;
    noShipping?: number;
    fixedShippingType?:number;
    fixedShippingFee?: number;
// ==
    limitNumber?: number | string;
    isBest?: number;
    isNew?: number;
    isHot?: number;
    isPromote?: number;
    promotePrice?: number;
    volumeList?: Object[]; //==
    userRankList?: UserRankListType[]; //==
    giveIntegral?: number;
    rankIntegral?: number;
    integral?: number;
// ==
    productVideo?: string;
    productDescArr?: ProductDescArrItem[];
// ==
    attrList: any;
    productList?: SeckillProductState[];
    attrChanged?: boolean;
// ==
    virtualSales?: number;
    commentTag?: string;
    seoProductTitle?: string;
    productWeight?: number;
    warnNumber?: number;
    isAloneSale?: number;
    keywords?: string;
    productInfo?: string;
    remark?: string;
    productCare?: string;
    serviceList: ServiceList[];
    productServiceIds?: number[];
    isSupportCod?: number;
    isSupportReturn?: number;
// ==
    productRelated?: number[];
    productArticleList?: number[];
    eCardList?: any[];
    cardGroupId?: number;
    virtualSample?: string;
    paidContent: ProductDescArrItem[];
    vendorProductId: number;
}
export interface UserRankListType {
    rankId:number;
    rankName:string;
    price:number;
}

export interface SuppliersListType{
    suppliersId?:number;
    suppliersName?:string;
}
export interface ShippingTplListType{
    shippingTplId:number;
    isDefault:number;
    shippingTplName:string;
}

export interface ImgListItem{
    picDesc:string;
    picLarge:string;
    picOriginal:string;
    picThumb:string;
    picUrl:string;
    picId:number;
    productId:number;
    sortOrder:number;
}

export interface ProductDescArrItem {
    type:string;
    pic:string;
    html:string;
}

export interface ServiceList {
    check:number;
    productServiceId:number;
    productServiceName:string;
}
export interface ProductFormResult {
    attrTplList:Object[];
    serviceList:ServiceList[];
    shippingTplList?: ShippingTplListType[];
    suppliersList?: SuppliersListType[];
    eCardList?: any[];
    item: {
        userRankList:Object[];
        productServiceIds:number[];
    }
}

export interface ProductParticipleFormResult {
    keywords:string
}


export interface AuditProductFormState {
    id: number;
    checkStatus: number;
    checkReason: string;
}


