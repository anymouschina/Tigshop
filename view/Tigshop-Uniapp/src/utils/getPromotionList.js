import { getPromotion } from "../api/product/product";
const getPromotionList = async (data) => {
    try {
        const result = await getPromotion({
            products: data.products,
            shopId: data.shopId,
            from: data.from
        });
        return result;
    }
    catch (error) {
        console.error(error);
        throw error;
    }
};
export default getPromotionList;
//# sourceMappingURL=getPromotionList.js.map