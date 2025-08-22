import { useConfigStore } from "@/store/config";
import { useCurrencyStore } from "@/store/currency";
import { ref } from "vue";
import { isOverseas } from "@/utils";

export const useCurrency = () => {
    const currencyStore = useCurrencyStore();
    const configStore = useConfigStore();
    const currency = ref("");
    const currencyName = ref("");

    const getCurrency = () => {
        currency.value = isOverseas() ? currencyStore.currentCurrencyData.symbol : configStore.dollarSign;
    };

    const getCurrencyName = () => {
        currencyName.value = isOverseas() ? currencyStore.currentCurrencyData.name : configStore.dollarSignCn;
    };

    getCurrency();
    getCurrencyName();

    return {
        currency,
        currencyName
    };
};
