export interface UserDataResponse {
    data: Item;
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
    showSign: number;
}
