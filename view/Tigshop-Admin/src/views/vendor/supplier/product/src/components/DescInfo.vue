<template>
    <ProductDesc
        v-model:descArr="formState.productDesc"
        :disabled="examine == 1"
        :label="'商品详情'"
    ></ProductDesc>
</template>
<script lang="ts" setup>
import { ProductFormState } from "@/types/vendor/product.d";
import ProductDesc from "@/views/vendor/supplier/product/src/ProductDesc.vue";
import { getAdminType } from "@/utils/storage";
const adminType = getAdminType();

const emit = defineEmits(["submitCallback", "update:confirmLoading", "close", "closeConfirm"]);
const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    shopId: {
        type: Number,
        default: 0
    },
    examine: {
        type: Number,
        default: 0
    },
    loading: {
        type: Boolean,
        default: false
    }
});
const formState = defineModel<ProductFormState>("formState", { default: {} });
;

</script>
<style lang="less" scoped>

</style>
