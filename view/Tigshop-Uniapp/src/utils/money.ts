import round from "lodash/round";

// 将传入值规整为两位小数金额字符串，避免浮点精度问题
export const toMoney = (val: any): string => {
    const num = Number(val);
    if (Number.isNaN(num)) return val ?? "0.00";
    return round(num, 2).toFixed(2);
};

// 规范化总计类对象中的金额字段
export const normalizeTotal = (t: any) => {
    const keys = [
        "productAmount",
        "serviceFee",
        "discounts",
        "discountAfter",
        "discountCouponAmount",
        "discountProductPromotionAmount",
        "discountSeckillAmount",
        "discountTimeDiscountAmount",
        "discountDiscountAmount"
    ];
    const res: any = { ...t };
    keys.forEach((k) => {
        if (k in res) res[k] = toMoney(res[k]);
    });
    return res;
};

// 规范化购物车列表内各商品金额字段
export const normalizeCartList = (list: any[] = []) => {
    return (list || []).map((shop: any) => ({
        ...shop,
        carts: (shop.carts || []).map((goods: any) => ({
            ...goods,
            price: toMoney(goods.price),
            originPrice: goods.originPrice !== undefined ? toMoney(goods.originPrice) : goods.originPrice,
            serviceFee: goods.serviceFee !== undefined ? toMoney(goods.serviceFee) : goods.serviceFee,
            extraSkuData: Array.isArray(goods.extraSkuData)
                ? goods.extraSkuData.map((es: any) => ({
                      ...es,
                      attrPrice: es?.attrPrice !== undefined ? toMoney(es.attrPrice) : es?.attrPrice,
                      totalAttrPrice: es?.totalAttrPrice !== undefined ? toMoney(es.totalAttrPrice) : es?.totalAttrPrice
                  }))
                : goods.extraSkuData
        }))
    }));
};

