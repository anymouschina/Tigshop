export interface SearchInfo {
    conversationList: SearchInfoList[];
    userList: SearchInfoList[];
}
export interface Content {
	messageType: string;
	content: string;
	pic: string;
	product: any;
	order: any;
}
export interface User {
	userId: number;
	username: string;
	nickname: string;
	avatar: string;
}
export interface Servant {
	adminId: number;
	username: string;
	avatar: string;
}
export interface SearchInfoList {
    id: number;
	userId: number;
	lastServantId: number;
	addTime: string;
	shopId: number;
	userFrom: string;
	status: number;
	lastUpdateTime: string;
	isDelete: number;
	remark: string;
	summary: string;
	content: Content;
	user: User;
	unreadMessageCount: number;
	lastMessage: lastMessage[]
}

export interface lastMessageContent {
	messageType: string;
	content: string;
	pic: string;
}

export interface lastMessage {
	messageTypeText: string;
	id: number;
	conversationId: number;
	content: lastMessageContent;
	messageType: string;
	type: number;
	userId: number;
	servantId: number;
	sendTime: string;
	status: number;
	extend?: any;
	pushStatus: number;
	isRead: number;
	shopId: number;
}

export interface msgFilterParams {
	conversationId: number;
    sortOrder?: string;
    firstId: number;
}
export interface MessageInfo {
	conversationId?: number;
	userId?: number;
	shopId?: number;
 }
export interface MessageList {
	messageTypeText: string;
	id: number;
	conversationId: number;
	content: Content;
	messageType: string;
	type: number;
	userId: number;
	servantId: number;
	sendTime: string;
	status: number;
	extend?: any;
	pushStatus: number;
	isRead: number;
	shopId: number;
	user: User;
	servant: Servant;
 }

export interface MessageDetail {
	id?: number;
	userId?: number;
	lastServantId?: number;
	addTime?: string;
	shopId?: number;
	userFrom?: string;
	status?: number;
	lastUpdateTime?: string;
	isDelete?: number;
	remark?: string;
	summary?: string;
	user?: User;
}

export interface QueueListFilterParams {
	page: number;
    size: number;
    sortField: string;
    sortOrder: string;
    keyword: string;
    firstWord: string;
    userFrom: string;
}

export interface HistoryFilterParams {
	page: number;
    size: number;
    timeType: number;
    startTime: string;
    endTime: string;
    username: string;
    lastServantId: number;
    userFrom: string;
    status: number;
    remark: string;
}

