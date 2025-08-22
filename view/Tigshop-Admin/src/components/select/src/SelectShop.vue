<template>
    <el-select
        v-model="shopId"
        :loading="loading"
        filterable
        remote
        :remoteMethod="remoteMethod"
        :multiple="props.multiple"
        placeholder="请输入店铺名称"
        clearable
        reserve-keyword
        @change="onChange"
    >
        <el-option v-for="item in options" :key="item.shopId" :label="item.shopTitle" :value="item.shopId" />
    </el-select>
</template>
<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from "vue";
import { getShopSelectList } from "@/api/shop/shop";
import { vendorShopBindShopList } from "@/api/vendor/bindShop";
import { isS2b2c } from "@/utils/version";
import { message } from "ant-design-vue";
import type { ShopSelectFilterParams } from "@/types/shop/shop.d";

const props = defineProps({
    modelValue: { type: [Number, String] },
    multiple: {
        type: Boolean,
        default: false
    }
    //multiple 是否多选，可直接写在父组件
});
const loading = ref<boolean>(true);
const filterParams = reactive<ShopSelectFilterParams>({
    //初使化用于查询的参数
    keyword: ""
});
const emit = defineEmits(["update:modelValue", "onChange"]);
const shopId = defineModel<number | string | number[]>("shopId");
const onChange = (e: any) => {
    emit("update:modelValue", e);
    emit("onChange", e);
};
onMounted(() => {
    loadFilter();
});

const isVendor = computed(() => {
    const adminType = localStorage.getItem("adminType");
    return isS2b2c() && adminType && adminType === "vendor";
});

const options: any = ref([]);

const loadFilter = async (query?: number | string) => {
    loading.value = true;
    filterParams.keyword = String(query || "");
    try {
        let result: any;

        if (isVendor.value) {
            result = await vendorShopBindShopList({ ...filterParams });
            options.value = result.records;
        } else {
            result = await getShopSelectList({ ...filterParams });
            options.value = result;
        }
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};

const remoteMethod = (query: string) => {
    if (!isVendor.value) return;

    loadFilter(query);
};
</script>
<style lang="less" scoped></style>
