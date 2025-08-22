<template>
    <div>
        <el-form-item
            :rules="[{ required: true, message: '商品售价不能为空', validator: validatePrice }]"
            class="inner-item"
            label="商品售价"
            prop="productPrice"
        >
            <PriceInput v-model:modelValue="formState.productPrice" :disabled="examine == 1" placeholder="请输入商品售价" width="200px"></PriceInput>
        </el-form-item>
        <el-form-item class="inner-item" extra="不填则根据设置的比例自动计算" label="市场价" prop="marketPrice">
            <div>
                <PriceInput v-model:modelValue="formState.marketPrice" :disabled="examine == 1" placeholder="请输入商品市场价" width="200px"></PriceInput>
                <div class="extra">划线价格，不填则不显示</div>
            </div>
        </el-form-item>
    </div>
    <Attr
        v-if="!loading && formState.productType !== 3"
        ref="attrForm"
        v-model:attrChanged="formState.attrChanged"
        v-model:attrList="formState.attrList"
        v-model:productList="formState.productList"
        v-model:skuErrorText="skuErrorText"
        :action="action"
        :attrTplList="attrTplList"
        :disabled="examine == 1"
    ></Attr>
    <el-form-item
        v-if="!formState.productList || (formState.productList.length == 0 && formState.productType !== 3)"
        :rules="[{ required: true, message: '商品库存不能为空', validator: validateStock }]"
        class="inner-item"
        label="库存"
        prop="productStock"
    >
        <TigInput v-model="formState.productStock" :disabled="examine == 1" placeholder="请输入商品库存" type="integer" width="200px" />
    </el-form-item>
    <el-form-item class="inner-item" label="商品限购" prop="limitNumber">
        <el-radio-group v-model="isLimit" style="width: 100%; margin-bottom: 10px; flex-direction: column; align-items: flex-start" @change="handleLimitChange">
            <el-radio :value="false">不限购</el-radio>
            <el-radio :value="true">
                <div class="flex">
                    <div class="mr10">限购</div>
                    <TigInput v-model="formState.limitNumber" :disabled="!isLimit" placeholder="请输入限购数量" type="integer" width="200px" />
                    <div class="ml10">件</div>
                </div>
            </el-radio>
        </el-radio-group>
    </el-form-item>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import { ProductFormState } from "@/types/product/product.d";
import PriceInput from "@/views/product/product/src/PriceInput.vue";
import Attr from "@/views/product/product/src/Attr.vue";
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
    act: {
        type: String,
        default: ""
    },
    attrTplList: {
        type: Array,
        default: []
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
const isLimit = defineModel<boolean>("isLimit", { default: false });

const validatePrice = (rule: any, value: any, callback: any) => {
    if (!value) {
        callback(new Error("商品售价不能为空"));
        return;
    } else {
        callback();
    }
};
const validateStock = (rule: any, value: any, callback: any) => {
    if (!value) {
        callback(new Error("商品库存不能为空"));
        return;
    } else {
        callback();
    }
};

const attrForm = ref<any>();
const skuErrorText = ref<string>("");
const handleLimitChange = (value: any) => {
    if (value) {
        formState.value.limitNumber = !formState.value.limitNumber ? 1 : formState.value.limitNumber;
    } else {
        formState.value.limitNumber = "";
    }
};
defineExpose({
  attrForm, skuErrorText
});
</script>
<style lang="less" scoped>
</style>
