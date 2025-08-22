// 列表查询时筛选参数类型
export interface ShopFilterParams {
    page: number;
    size: number;
    sortField?: string,
    sortOrder?: string,
    keyword?: string;
    mainAccount?: string;
    account?: string;
    status?: number | string;
    shopTitle?: string;
    endTime?: string;
    startTime?: string;
    shopId?: number | string;
}
export interface ShopSelectFilterParams {
    keyword?: string;
    size?: number;
}

// 获取列表返回参数类型
export interface ShopFilterResult {
    records: ShopFilterState[];
    filter: {
        page: number;
    };
    total: number;
}
export interface ShopFilterState {
    shopId: number;
    storeTitle?: string;
    storeLogo?: string;
    userName?: string;
    isSelf?: number;
    shopRankId?: number;
    shopRankName?: string;
    shopStatus?: number;
}

// 获取详情返回参数类型
export interface ShopFormResult {
    item: ShopFormState[];
}
export interface ShopFormState {
    shopId?: number;
    merchantId?: number;
	shopTitle?: string;
	shopLogo?: string;
	description?: string;
	contactMobile?: string;
	status?: number;
}



export interface ShopSettlementFormState {
    code?: string;
    dateType?: number;
    useDay?: number;
    shopId?: number;
}