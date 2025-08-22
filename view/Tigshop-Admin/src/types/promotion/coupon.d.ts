// 列表查询时筛选参数类型
export interface CouponFilterParams {
    page: number;
    size: number;
    sortField: string;
    sortOrder: string;
    keyword?: string;
    isShow?: number;
    shopId?: number;
}

// 获取列表返回参数类型
export interface CouponFilterResult {
    records: CouponFilterState[];
    filter: {
        page: number;
    };
    total: number;
}
export interface CouponFilterState {
    couponId?: number;
    couponName?: string;
    couponType?: number;
    isNewUser?: number;
    limitUserRank?: number;
    couponMoney?: number;
    minOrderAmount?: string;
    isShow?: boolean;
    sortOrder?: number;
}

// 获取详情返回参数类型
export interface CouponRankList {
    rankId?: number;
    rankName?: string;
}
export interface CouponFormState {
	sendRange?: number;
	sendRangeData: any[];
	isGlobal?: number;
	isShow?: number;
	couponDiscount?: number;
	couponType?: number;
	isNewUser?: number;
	limitUserRank?: string[];
	sendType?: number;
	useStartDate?: string;
	useEndDate?: string;
	couponName?: string;
	couponDesc?: string;
	couponMoney?: number;
	minOrderAmount?: number;
	delayDay?: number;
	useDay?: number;
	sendNum?: number;
	couponUnit?: number;
	limitNum?: number;
	reduceType?: number;
	maxOrderAmount?: number;
}
