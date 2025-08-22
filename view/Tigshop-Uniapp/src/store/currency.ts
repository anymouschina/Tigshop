import { defineStore } from "pinia";
import { ref } from "vue";
import { getCurrencyList } from "@/api/common";
import type { CurrencyItem } from "@/types/common.d.ts";
import { useStorageData } from "@/hooks";

export const useCurrencyStore = defineStore("currency", () => {
    // 货币列表
    const currencyList = ref<CurrencyItem[]>([]);
    // 当前货币数据
    const currentCurrencyData = ref<CurrencyItem>({} as CurrencyItem);

    const { data, setStorageData } = useStorageData("currencyData");

    const fetchCurrencyList = async () => {
        try {
            const result = await getCurrencyList();
            currencyList.value = result;

            // 如果本地存储中有数据，则直接使用本地存储的数据
            if (data.value) {
                setDefaultData(data.value);
                return;
            }

            // 找到默认货币，并将其赋值给 currentCurrencyData
            const defaultData = result.find((item) => item.isDefault === 1)!;
            setDefaultData(defaultData);
        } catch (error) {
            console.error(error);
        }
    };
    // 设置默认货币
    const setDefaultData = (currentCurrency: CurrencyItem) => {
        currentCurrencyData.value = currentCurrency;
        setStorageData(currentCurrency);
    };

    // 返回响应式属性和方法
    return {
        currencyList,
        currentCurrencyData,
        fetchCurrencyList,
        setDefaultData
    };
});
