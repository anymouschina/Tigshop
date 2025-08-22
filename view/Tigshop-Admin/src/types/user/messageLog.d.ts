// 列表查询时筛选参数类型
export interface MessageLogFilterParams {
    page: number,
    size: number,
    sortField: string,
    sortOrder: string,
    keyword?: string;
}

// 获取列表返回参数类型
export interface MessageLogFilterState {
    sendTypeName: string;
	statusName: string;
	messageLogId: number;
	messageType: number;
	sendUserType: number;
	userIds: string;
	userRank: number;
	messageTitle: string;
	messageContent: string;
	messageLink: string;
	sendTime: string;
	isRecall: number;
}
export interface MessageLogFilterResult {
    records: MessageLogFilterState[];
    filter: MessageLogFilterParams;
    total: number;
}
export interface MessageLogFormResult {
    item: MessageLogFormState;
}

// 获取详情返回参数类型
export interface MessageLogFormState {
    messageLogId?: number;
    messageTitle?: string;
    messageContent?: string;
    messageLink?: Object;
    userIds?: number;
    userRank?: number;
    userList?: string;
    sendUserType?: number;
}



