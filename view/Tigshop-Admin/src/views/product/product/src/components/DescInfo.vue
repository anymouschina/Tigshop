<template>
    <ProductDesc
        v-if="formState.productType == 4"
        v-model:descArr="formState.paidContent"
        :disabled="examine == 1 || type !== ''"
        :productType="formState.productType"
        label="付费内容详情"
    ></ProductDesc>
    <ProductDesc
        v-model:descArr="formState.productDescArr"
        :disabled="examine == 1"
        :label="formState.productType == 4 ? '普通商品详情' : '商品详情'"
    ></ProductDesc>
    <el-form-item
        v-if="formState.productType == 2"
        :rules="[{ required: true, message: '虚拟商品信息不能为空!', validator: validateVirtualSample }]"
        label="虚拟商品信息"
        prop="virtualSample"
    >
        <Editor v-model:html="formState.virtualSample" height="350px"></Editor>
        <div class="extra">此处填写内容，将在订单详情中展示</div>
    </el-form-item>
</template>
<script lang="ts" setup>
import { ProductFormState } from "@/types/product/product.d";
import ProductDesc from "@/views/product/product/src/ProductDesc.vue";
import { Editor } from "@/components/editor/index";
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
    type: {
        type: String,
        default: ""
    },
    loading: {
        type: Boolean,
        default: false
    }
});
const formState = defineModel<ProductFormState>("formState", { default: {} });

const validateVirtualSample = (rule: any, value: any, callback: any) => {
    if (value == "<p><br></p>" || value == "") {
        callback(new Error("虚拟商品信息不能为空"));
        return;
    } else {
        callback();
    }
};

</script>
<style lang="less" scoped>

</style>
