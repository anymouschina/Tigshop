import { defineStore } from "pinia";
export const useAppStore = defineStore("app", {
    state: () => {
        return {
            headerTitle: "",
            routerKey: 0
        };
    },
    getters: {
        getHeaderTitle(state) {
            return state.headerTitle;
        }
    },
    actions: {
        setHeaderTitle(str: string) {
            this.headerTitle = str;
        }
    }
});
