// 列表查询时筛选参数类型
export interface FeedbackFilterParams {
    page: number;
    size: number;
    sortField: string;
    sortOrder: string;
    keyword?: string;
    type?: string;
    status?: string;
}

// 获取列表返回参数类型
export interface FeedbackFilterState {
    id?: number;
    addTime?: string;
    content?: string;
    complaintInfo?: string;
    email?: string;
    feedbackPics?: string[];
    mobile?: string;
    orderId?: number;
    parentId?: number;
    shopId?: number;
    status?: number;
    statusName?: string;
    title?: string;
    type?: number;
    userId?: number;
    username?: string;
    orderInfo?: orderInfo;
}
export interface FeedbackFilterResult {
    records: FeedbackFilterState[];
    filter: FeedbackFilterParams;
    total: number;
}

export interface FeedbackFormResult {
    item: FeedbackFormState;
}

interface product {
    productId: number;
    productName: string;
}

interface orderInfo {
    orderId: number;
    orderSn: string;
}

interface store {
    shopId: number;
    storeTitle: string;
}

interface reply {
    content: string;
    email: string;
    id: number;
    mobile: string;
    parentId: number;
    status: number;
    statusName: string;
    type: number;
    typeName: string;
    username: string;
}

// 获取详情返回参数类型
export interface FeedbackFormState {
    id?: number;
    addTime?: string;
    content?: string;
    complaintInfo?: string;
    email?: string;
    feedbackPics?: string[];
    mobile?: string;
    orderId?: number;
    orderInfo?: orderInfo;
    parentId?: number;
    shopId?: number;
    store?: store;
    status?: number;
    statusName?: string;
    title?: string;
    type?: number;
    typeName?: string;
    userId?: number;
    username?: string;
    productId?: number;
    product: product;
    reply?: reply;
}


