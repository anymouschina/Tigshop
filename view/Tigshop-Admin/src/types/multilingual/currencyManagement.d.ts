// 列表查询时筛选参数类型
export interface CurrencyFilterParams {
    page: number;
    size: number;
    sortField: string;
    sortOrder: string;
    name?: string;
}

// 获取列表返回参数类型
export interface CurrencyFilterResult {
    records: CurrencyFilterState[];
    filter: {
        page: number;
    };
    total: number;
}
export interface CurrencyFilterState {
	id?: number;
	name?: string;
	symbol?: string;
	isDefault?: number;
	rate?: string;
}
// 获取详情返回参数类型
export interface CurrencyFormState {
    id?: number;
	name?: string;
	symbol?: string;
	localesId?: string;
	isDefault?: number;
	rate?: string;
}




