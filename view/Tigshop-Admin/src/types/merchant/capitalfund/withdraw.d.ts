// 列表查询时筛选参数类型
export interface WithdrawFilterParams {
    page: number;
    size: number;
    sortField?: string,
    sortOrder?: string,
    addTimeStart?: string;
    addTimeEnd?: string;
    status?: string;
}

// 获取列表返回参数类型
export interface WithdrawFilterResult {
    records: WithdrawFilterState[];
    filter: {
        page: number;
    };
    total: number;
}
export interface WithdrawFilterState {
    shopWithdrawLogId?: number;
	shopId?: number;
	amount?: string;
	status?: number;
	addTime?: string;
	remarks?: string;
	merchantAccountId?: number;
	accountData?: accountForm;
}

// 获取详情返回参数类型
export interface WithdrawFormResult {
    item: WithdrawFormState;
}
export interface WithdrawFormState {
    amount?: number | string;
    status?: number;
	merchantAccountId?: number | string;
	auditRemark?: string;
	addTime?: string;
	paymentVoucher?: string;
	remark: string;
    accountData?: accountForm;
}
export interface accountForm {
	accountTypeText: string;
	accountId: number;
	merchantId: number;
	accountType: number;
	accountName: string;
	accountNo: string;
	bankName: string;
	addTime: string;
	bankBranch: string;
}

