// 列表查询时筛选参数类型
export interface PriceInquiryFilterParams {
    page: number;
    size: number;
    sortField: string,
    sortOrder: string,
    productId?: string;
    mobile?: string;
    status?: string;
}

// 获取列表返回参数类型
export interface PriceInquiryFilterState {
    id: number;
    content: string;
    createTime?: string;
    mobile?: string;
    remark?: boolean;
    shopInfo?: {
        shopTitle: string;
        shopId: number;
    };
    product?: {
        productName: string;
        productSn: string;
        productId: number;
    };
    status?: number;
}
export interface PriceInquiryFilterResult {
    records: PriceInquiryFilterState[];
    filter: PriceInquiryFilterParams;
    total: number;
}

// 获取详情返回参数类型
export interface PriceInquiryFormState {
    id: number;
    content: string;
    createTime?: string;
    mobile?: string;
    remark?: boolean;
    shopInfo?: {
        shopTitle: string;
        shopId: number;
    };
    product?: {
        productName: string;
        productSn: string;
        productId: number;
    };
    status?: number;
}


