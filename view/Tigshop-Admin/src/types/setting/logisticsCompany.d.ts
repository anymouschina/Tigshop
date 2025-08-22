
export interface LogisticsCompanyFilterParams {
    page: number;
    size: number;
    sortField?: string;
    sortOrder?: string;
    keyword?: string;
}

export interface LogisticsCompanyFilterResult {
    records: LogisticsCompanyFilterState[];
    filter: {
        page: number;
    };
    total: number;
}

export interface LogisticsCompanyFilterState {
    logisticsId: number;
    logisticsCode?: string;
    logisticsName?: string;
    logisticsDesc?: string;
    customerName?: string;
    customerPwd?: string;
    monthCode?: string;
    sendSite?: string;
    sendStaff?: string;
    expType?: number;
    isShow?: number;
    sortOrder?: number;
}

export interface LogisticsCompanyFormResult {
    item: LogisticsCompanyFormState;
}

export interface LogisticsCompanyFormState {
    logisticsId?: number;
    logisticsName?: string;
    logisticsCode?: string;
    logisticsDesc?: string;
    customerName?: string;
    customerPwd?: string;
    monthCode?: string;
    sendSite?: string;
    sendStaff?: string;
    expType?: number;
    sortOrder?: number;
    isShow?: number;
}
