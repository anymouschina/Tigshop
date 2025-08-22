// 获取详情返回参数类型

export interface AfterSalesServiceFilterResult {
    records: AfterSalesServiceFilterState[];
    filter: {
        page: number;
    };
    total: number;
}
export interface AfterSalesServiceFilterState {
    templateContent?: string;
}
