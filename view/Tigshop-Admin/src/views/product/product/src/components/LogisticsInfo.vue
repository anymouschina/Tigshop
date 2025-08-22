<template>
    <el-form-item v-if="formState.productType != 1" :rules="[{ required: true, message: '请选择配送方式!' }]" label="配送方式" prop="noShipping">
        <el-radio-group v-model="formState.noShipping" :disabled="examine == 1" style="width: 100%; margin-bottom: 10px">
            <el-radio :value="1">无需配送</el-radio>
        </el-radio-group>
        <el-radio-group v-model="formState.noShipping" :disabled="examine == 1 || formState.productType != 1" style="width: 100%">
            <el-radio :value="0">
                <div class="flex">
                    <div class="mr10">运费模板</div>
                    <el-form-item label="" prop="shippingTplId">
                        <div class="flex flex-justify-between">
                            <el-select
                                v-model="formState.shippingTplId"
                                :disabled="examine == 1 || formState.productType != 1 || formState.noShipping == 1"
                                placeholder="请选择"
                                style="width: 100%"
                            >
                                <el-option
                                    v-for="item in formState.shippingTplList"
                                    :key="item.shippingTplId"
                                    :label="item.shippingTplName"
                                    :value="item.shippingTplId"
                                />
                            </el-select>
                            <div v-if="examine != 1" class="con-btn">
                                <DialogForm
                                    :params="{ act: 'add' }"
                                    isDrawer
                                    path="setting/shippingTpl/Info"
                                    title="添加运费模板"
                                    width="900px"
                                    @okCallback="fetchProductConfig"
                                >
                                    <el-button link type="primary">新建</el-button>
                                </DialogForm>
                                <p class="ml10 mr10" style="margin-bottom: 3px">|</p>
                                <el-button :loading="configLoading" link type="primary" @click="fetchProductConfig">刷新 </el-button>
                            </div>
                        </div>
                    </el-form-item>
                </div>
            </el-radio>
        </el-radio-group>
    </el-form-item>
    <el-form-item v-if="formState.productType == 1" :rules="[{ required: true }]" label="快递运费" prop="fixedShippingType">
        <el-radio-group v-model="formState.fixedShippingType" :disabled="examine == 1" style="width: 100%; margin-bottom: 25px">
            <div>
                <el-radio :value="1">
                    <div class="fixed-shipping-type">
                        <div class="flex flex-align-center">
                            <div class="mr10">固定运费</div>
                            <el-form-item
                                :rules="[
                                    {
                                        required: true,
                                        validator: validateShippinFee
                                    }
                                ]"
                                class="inner-item"
                                label=""
                                prop="fixedShippingFee"
                            >
                                <PriceInput
                                    v-model:modelValue="formState.fixedShippingFee"
                                    :disabled="examine == 1 || formState.fixedShippingType == 2"
                                    placeholder="请输入运费"
                                    width="200px"
                                ></PriceInput>
                            </el-form-item>
                        </div>
                    </div>
                </el-radio>
                <div class="extra" style="margin-top: 5px; margin-left: 20px">
                    设置固定运费为0时，前台展示为包邮。
                    <el-popover :width="400" placement="right-end" trigger="click">
                        <template #reference>
                            <a>查看示例</a>
                        </template>
                        <template #default>
                            <img src="@/style/images/fixedShippingFee.png" style="width: 380px" />
                        </template>
                    </el-popover>
                </div>
            </div>
        </el-radio-group>

        <el-radio-group v-model="formState.fixedShippingType" :disabled="examine == 1 || formState.productType != 1" style="width: 100%">
            <el-radio :value="2">
                <div class="flex">
                    <div class="mr10">运费模板</div>
                    <el-form-item label="" prop="shippingTplId">
                        <div class="flex flex-justify-between">
                            <el-select
                                v-model="formState.shippingTplId"
                                :disabled="examine == 1 || formState.productType != 1 || formState.fixedShippingType == 1"
                                placeholder="请选择"
                                style="width: 100%"
                            >
                                <el-option
                                    v-for="item in formState.shippingTplList"
                                    :key="item.shippingTplId"
                                    :label="item.shippingTplName"
                                    :value="item.shippingTplId"
                                />
                            </el-select>
                            <div v-if="examine != 1" class="con-btn">
                                <DialogForm
                                    :params="{ act: 'add' }"
                                    isDrawer
                                    path="setting/shippingTpl/Info"
                                    title="添加运费模板"
                                    width="900px"
                                    @okCallback="fetchProductConfig"
                                >
                                    <el-button link type="primary">新建</el-button>
                                </DialogForm>
                                <p class="ml10 mr10" style="margin-bottom: 3px">|</p>
                                <el-button :loading="configLoading" link type="primary" @click="fetchProductConfig">刷新 </el-button>
                            </div>
                        </div>
                    </el-form-item>
                </div>
            </el-radio>
        </el-radio-group>
    </el-form-item>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import { message } from "ant-design-vue";
import { ProductFormState } from "@/types/product/product.d";
import { getProductConfig } from "@/api/product/product";
import PriceInput from "@/views/product/product/src/PriceInput.vue";
import { DialogForm } from "@/components/dialog";
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

const validateShippinFee = (rule: any, value: any, callback: any) => {
    if (!value || Number(value) !== 0) {
        if (formState.value.fixedShippingType == 1) {
            if (value !== 0 && !value) {
                callback(new Error("运费不能为空"));
                return;
            }
            if (Number(value) > 999999) {
                callback(new Error("运费不能超过999999"));
                return;
            }
            callback();
            return;
        }
        callback();
    } else {
        callback();
    }
};
const configLoading = ref(false);

const fetchProductConfig = async (isMsg: boolean = true) => {
    configLoading.value = true;
    try {
        const result = await getProductConfig({ shopId: props.shopId });
        formState.value.shippingTplList = result.shippingTplList;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        setTimeout(() => {
            configLoading.value = false;
        }, 200);
    }
};
</script>
<style lang="less" scoped>
.con-btn {
    display: flex;
    align-content: center;
    padding-left: 10px;

    span {
        color: #999;
    }

    a {
        display: block;
        word-break: keep-all;
        padding: 0 5px;
    }
}
</style>
