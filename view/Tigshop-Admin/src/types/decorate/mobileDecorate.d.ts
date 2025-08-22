// 列表查询时筛选参数类型
export interface FilterParams {
    page: number;
    size: number;
    sortField: string;
    sortOrder: string;
    parentId?: number;
    keyword?: string;
    decorateType?: number;
    isEnabled?: number;
}

// 获取列表返回参数类型
export interface FilterResult {
    records: FilterState[];
    filter: {
        page: number;
    };
    total: number;
}
export interface FilterState {
    decorateId: number;
    decorateTitle?: string;
    sortOrder?: number;
    decorateType?: number;
}

// 获取详情返回参数类型
export interface FormResult {
    item: FormState;
}
export interface FormState {
    decorateTitle?: string;
    decorateDesc?: string;
    sortOrder?: string;
}
