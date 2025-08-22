export interface SignInfoResponse {
    list: { [key: string]: SignInfo[] };
    code: number;
    message: string;
}
export interface SignInfo {
    signPoints: number;
    record: number;
    isSign: number;
    days: AnyObject;
    recommendGoods: AnyObject;
}
