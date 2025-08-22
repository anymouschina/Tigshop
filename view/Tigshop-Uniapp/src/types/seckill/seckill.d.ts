// 获取列表返回参数类型
export interface SeckillFilterState {
    productId: number;
    seckillLimitNum: number;
    seckillSales: number;
    productName: string;
    picThumb: string;
    productSn: string;
    marketPrice: string;
    seckillPrice: string;
    seckillStock: number;
    skuId: number;
}

export interface SeckillFilterResult {
    data: SeckillData;
    code: number;
    message: string;
}

export interface SeckillData {
    records: SeckillFilterState[];
    total: number;
}
