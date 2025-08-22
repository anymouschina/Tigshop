<template>
    <div>
        <el-form-item class="inner-item" label="销售规格" prop="skuType">
            <el-radio-group v-model="formState.skuType" :disabled="examine == 1" style="width: 100%">
                <el-radio :value="1">统一规格</el-radio>
                <el-radio :value="2">多规格</el-radio>
            </el-radio-group>
            <div class="extra">选择在售时，商品新增成功时会自动进入总后台进行审核，审核通过后，店铺才可进行售卖</div>
        </el-form-item>
    </div>
    <Attr
        v-if="!loading"
        ref="attrForm"
        v-model:attrChanged="formState.attrChanged"
        v-model:attrList="formState.skuAttrs"
        v-model:productList="formState.skus"
        v-model:skuErrorText="skuErrorText"
        :skuType="formState.skuType"
        :productSnGenerateType="formState.productSnGenerateType"
        :action="action"
        :disabled="examine == 1"
    ></Attr>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import { ProductFormState } from "@/types/vendor/product.d";
import Attr from "@/views/vendor/supplier/product/src/Attr.vue";
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close", "closeConfirm"]);
const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    act: {
        type: String,
        default: ""
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
const action = ref<string>(props.act);
const formState = defineModel<ProductFormState>("formState", { default: {} });

const attrForm = ref<any>();
const skuErrorText = ref<string>("");
;
defineExpose({
    attrForm,
    skuErrorText
});
</script>
<style lang="less" scoped></style>
