// 列表查询时筛选参数类型
export interface AftersalesFilterParams {
    page: number;
    size: number;
    sortField: string,
    sortOrder: string,
    keyword?: string;
    aftersaleType?: number | string;
    status?: number | string;

}

// 获取列表返回参数类型
export interface AftersalesFilterResult {
    records: AftersalesFilterState[];
    statusList: any[];
    typeList: any[];
    filter: {
        page: number;
    };
    total: number;
}

// 获取详情返回参数类型
export interface AftersalesFilterState {
    aftersaleId?: number;
    aftersalesSn?: number;
    orderSn?: number;
    orderItemId?: number;
    aftersaleType?: number;
    status?: number;
    number?: number;
    pics?: string[];
    description?: string;
    reply?: string;
    addTime?: string;
    shippingTime?: string;
    trackingNo?: string;
    logisticsName?: string;
    userName?: string;
    aftersaleReason?: string;
    aftersalesTypeName?: string;
    statusName?: string;
    aftersalesItems: productList[]
}
export interface productList {
    aftersalesItemId?: number;
	orderItemId?: number;
	number?: number;
	aftersaleId?: number;
	orderSn?: string;
	productName?: string;
	orderId?: number;
	picThumb?: string;
	productSn?: string;
	productId?: number;
	quantity?: number;
	price?: number;
}

export interface FormState {
    aftersaleId?:number;
    aftersaleType?:number;
    addTime?:string;
    shippingTime?:string;
    aftersalesTypeConfig?:object[];
    aftersalesLog?:aftersalesLog[];
    aftersalesTypeName?:string;
    description?:string;
    logisticsName?:string;
    number:number;
    modifyNumber?:number;
    orderId?:number;
    orderItemId?:number;
    orderSn?:string;
    picThumb:string;
    pics?:string;
    productName?:string;
    productSn?:string;
    reply?:string;
    status?:number;
    refundAmount?:number;
    suggestRefundAmount?:number;
    statusName?:string;
    statusConfig?: object[];
    trackingNo?:string;
    userName?:string;
    aftersaleReason?:string;
    refuseReason?:string[];
    aftersalesItems?: productList[];
    refund?: any;
}

export interface aftersalesLog {
    logId?: number;
	aftersaleId?: number;
	logInfo?: string;
	addTime?: string;
	adminName?: string;
	refundMoney?: string;
	refundType?: number;
	refundDesc?: string;
	userName?: string;
	returnPic: returnPic[];
}

export interface returnPic {
	picId?: number;
	picThumb?: string;
	picUrl?: string;
	picName?: string;
}
