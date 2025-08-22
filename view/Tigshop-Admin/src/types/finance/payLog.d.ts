
export interface PayLogFilterParams {
    page: number,
    size: number,
    payStatus: number,
    sortField: string,
    sortOrder: string,
    keyword?: string;
}

// 获取列表返回参数类型
export interface PayLogFilterState {
    brandId: number;
    brandName: string;
    brandLogo: string;
    firstWord: string;
    brandIsHot: boolean;
    isShow: boolean;
    sortOrder: number;
}
export interface PayLogFilterResult {
    records: PayLogFilterState[];
    filter: PayLogFilterParams;
    total: number;
}

export interface PayLogFormResult {
    item: PayLogFormState;
}

// 获取详情返回参数类型
export interface PayLogFormState {
    brandName?: string;
    brandLogo?: string;
    brandDesc?: string;
    sortOrder?: string;
    firstWord?: string;
    isShow?: number;
    brandIsHot?: number;
}





