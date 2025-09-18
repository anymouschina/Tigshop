import { ref } from "vue";
export default function useStorageData(key) {
    const data = ref(uni.getStorageSync(key) || null);
    function setStorageData(value) {
        data.value = value;
        uni.setStorageSync(key, value);
    }
    return {
        data,
        setStorageData
    };
}
//# sourceMappingURL=useStorageData.js.map