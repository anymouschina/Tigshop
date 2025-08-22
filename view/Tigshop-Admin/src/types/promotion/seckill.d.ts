// 列表查询时筛选参数类型
export interface SeckillFilterParams {
    page: number;
    size: number;
    sortField: string,
    sortOrder: string,
    keyword?: string;
}

// 获取列表返回参数类型
export interface SeckillFilterResult {
    records: SeckillFilterState[];
    filter: {
        page: number;
    };
    total: number;
}
export interface SeckillFilterState {
    statusName?: string
    seckillId?: number
    seckillName?: string
    seckillStartTime?: string
    seckillEndTime?: string
    seckillLimitNum?: number
    productId?: number
    productName?: string
}


// 获取详情返回参数类型
export interface SeckillFormState {
    statusName?: string
    seckillId?: number
    seckillName?: string
    seckillStartTime?: string
    seckillEndTime?: string
    seckillLimitNum?: number
    productId?: number
    productName?: string
    picThumb?: string
    seckillItem:SeckillProductState[]
}

export interface SeckillProductState {
    skuId: number
    productId: number
    picThumb: string
    productName: string
    tipValue: string
    skuValue: string
    skuData: SkuState[]
    skuSn: string
    skuStock: number
    skuTsn: string
    skuPrice: string
    secondsSeckill: number;
    seckillPrice: string;
    productPrice: string;
    seckillStock: number;
    productStock: number;
}
export  interface SkuState{
    name:string;
    value:string;
}
