// 列表查询时筛选参数类型
export interface LocalesFilterParams {
    page: number;
    size: number;
    sortField: string;
    sortOrder: string;
    keyword?: string;
}

// 获取列表返回参数类型
export interface LocalesFilterResult {
    records: LocalesFilterState[];
    filter: {
        page: number;
    };
    total: number;
}
export interface LocalesFilterState {
    id?: number;
    localeId?: number;
    localeCode?: string;
    translationValue?: string;
    language?: string;
    flagPicture?: string;
    lastUpdated?: string;
    isEnabled?: number;
    isDefault?: number;
}


// 获取详情返回参数类型
export interface LocalesFormState {
    id?: number;
    currencyId?: number;
    localeCode?: string;
    language?: string;
    flagPicture?: string;
    isEnabled?: number;
    isDefault?: number;
    sort?: number;
}
