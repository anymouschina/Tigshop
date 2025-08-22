// 列表查询时筛选参数类型
export interface MessageTypeFilterParams {
    page: number,
    size: number,
    sortField: string,
    sortOrder: string,
    keyword?: string;
    sendType?: number;
}

// 获取列表返回参数类型
export interface MessageTypeFilterResult {
    records: MessageTypeFilterState[];
    filter: {
        page: number;
    };
    total: number;
}
export interface MessageTypeFilterState {
    messageId: number;
    name?: string;
    describe?: string;
    isWechat?: number;
    isMiniProgram?: number;
    isMessage?: number;
    isMsg?: number;
    isApp?: number;
    isDing?: number;
    addTime?: number;
}


// 获取详情返回参数类型
export interface MessageTypeFormState {
    messageId?: number;
    name?: string;
    describe?: string;
    isWechat?: number;
    isMiniProgram?: number;
    isMessage?: number;
    isMsg?: number;
    isApp?: number;
    isDing?: number;
    addTime?: number;
    templateMessage:TemplateMessageState;
}
export interface TemplateMessageState{
    wechatData: TemplateMessageStateItem;
    appData: TemplateMessageStateItem;
    dingData: TemplateMessageStateItem;
    messageData: TemplateMessageStateItem;
    miniProgramData: TemplateMessageStateItem;
    msgData: TemplateMessageStateItem;

}

export interface TemplateMessageStateItem{
    content?: string;
    id?: number;
    messageId?: number;
    templateId?: string;
    templateName?: string;
    templateNum?: string;
    toUserid?: string;
    type?: number;
    typeName?: string;
}
