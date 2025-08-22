export interface UserDataResponse {
    data: UserItem;
    code: number;
    message: string;
}

export interface UserItem {
    dimUsername: string;
    userId: number;
    username: string;
    nickname: string;
    avatar: string;
    points: number;
    balance: string;
    frozenBalance: string;
    birthday: string;
    mobile: string;
    email: string;
    rankId: number;
    rankName: string;
    rankIco: string;
    discount: number;
    totalBalance: string;
    coupon: number;
}

export interface SalesmanDataResponse {
    data: SalesmanItem;
    code: number;
    message: string;
}
export interface SalesmanItem {
    salesmanId: number;
    userId: number;
    level: number;
    groupId: number;
    pid: number;
    addTime: string | null;
    shopId: number | null;
    saleAmount: string;
    levelName: string;
    condition: Condition;
    order: Order;
    salesmanConfig: SalesmanConfig;
}
interface Condition {
    selfBuyAmount: ObjectSales;
    salesAmount: ObjectSales;
    salesInviteUsers: ObjectSales;
}
interface ObjectSales {
    checked: boolean;
    value: number;
}
interface Order {
    todaySum: number;
    allSum: number;
    waitCpsSum: number;
    todayCount: number;
    allCount: number;
    todayUserCount: number;
    allUserCount: number;
    selfBuySum: number;
}
interface SalesmanConfig {
    code: string;
    saleType: number;
    salesmanId: number;
    shopId: string | null;
    userId: number;
    level: Array;
}
