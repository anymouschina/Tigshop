

export interface SalesmanConfigFormState {
	saleType: number;
	level: Level[];
}

export interface Self_buy_amount {
	checked: boolean;
	value: number;
	title: string;
	unit: string;
}

export interface Sales_amount {
	checked: boolean;
	value: number;
	title: string;
	unit: string;
}

export interface Sales_invite_user {
	checked: boolean;
	value: number;
	title: string;
	unit: string;
}

export interface Invite_sale {
	checked: boolean;
	value: number;
	title: string;
	unit: string;
}

export interface Condition {
	selfBuyAmount: Self_buy_amount;
	salesAmount: Sales_amount;
	salesInviteUsers: Sales_invite_user;
	inviteSales: Invite_sale;
}

export interface Level {
	id: number;
	name: string;
	rate: number;
	condition: Condition;
	downSalesmanRate: number;
}

