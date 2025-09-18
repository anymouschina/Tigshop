import { ref } from "vue";
import { onReachBottom } from "@dcloudio/uni-app";
import getPromotionList from "../utils/getPromotionList";
export default function useList(api, options) {
    const data = ref([]);
    const promotionList = ref({});
    const total = ref(0);
    const isLoading = ref(true);
    const isLoadMore = ref(false);
    const error = ref(null);
    const persistentExtraData = ref({});
    const { immediate = false, needReachBottom = true, needPromotionList = false, params = {}, path = {} } = options;
    const { dataKey = "list", totalKey = "total", pageKey = "page", sizeKey = "size" } = path;
    // 初始化分页参数
    if (!params[pageKey]) {
        params[pageKey] = 1;
    }
    if (!params[sizeKey]) {
        params[sizeKey] = 10;
    }
    const resetState = () => {
        data.value = [];
        total.value = 0;
        error.value = null;
        params[pageKey] = 1;
        persistentExtraData.value = {};
    };
    const getList = async (extraData) => {
        try {
            if (extraData !== undefined) {
                const resolvedExtraData = typeof extraData === "function" ? extraData() : extraData;
                persistentExtraData.value = { ...persistentExtraData.value, ...resolvedExtraData };
            }
            const requestData = {
                ...params,
                ...persistentExtraData.value
            };
            if (requestData[pageKey] > 1) {
                isLoadMore.value = true;
            }
            else {
                isLoading.value = true;
                data.value = []; // 重置数据
            }
            const res = await api(requestData);
            const currentData = dataKey === "" ? res : (res[dataKey] ?? []);
            data.value = requestData[pageKey] === 1 ? currentData : [...data.value, ...currentData];
            total.value = res[totalKey] ?? 0;
            if (needPromotionList && currentData.length) {
                try {
                    const productIds = currentData.map((item) => ({
                        productId: item.productId
                    }));
                    const resPromotion = await getPromotionList({
                        products: productIds,
                        from: "list"
                    });
                    promotionList.value = {
                        ...promotionList.value,
                        ...resPromotion
                    };
                }
                catch (err) {
                    console.error("获取促销信息失败:", err);
                }
            }
            if (options.manageData) {
                options.manageData(data.value);
            }
        }
        catch (err) {
            error.value = err instanceof Error ? err : new Error(String(err));
            console.error("获取列表数据失败:", err);
        }
        finally {
            isLoading.value = false;
            isLoadMore.value = false;
        }
    };
    const reachBottom = () => {
        if (!isLoading.value && !isLoadMore.value && params[pageKey] < Math.ceil(total.value / params[sizeKey])) {
            params[pageKey]++;
            getList();
        }
    };
    if (needReachBottom) {
        onReachBottom(reachBottom);
    }
    if (immediate) {
        getList();
    }
    return {
        data,
        promotionList,
        total,
        isLoading,
        isLoadMore,
        error,
        getList,
        reachBottom,
        resetState
    };
}
//# sourceMappingURL=useList.js.map