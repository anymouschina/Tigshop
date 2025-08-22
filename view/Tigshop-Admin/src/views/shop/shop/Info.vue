<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                        <el-form-item label="店铺状态" prop="status">
                            <el-radio-group v-model="formState.status">
                                <el-radio-button label="暂停运营" :value="4" />
                                <el-radio-button label="运营中" :value="1" />
                            </el-radio-group>
                        </el-form-item>
                        <el-form-item label="店铺名称" prop="shopTitle" :rules="[{ required: true, message: '店铺名称不能为空!' }]">
                            <TigInput classType="tig-form-input" v-model="formState.shopTitle" />
                        </el-form-item>
                        <el-form-item label="店铺LOGO" prop="shopLogo">
                            <FormAddGallery v-if="!loading" v-model:photo="formState.shopLogo"></FormAddGallery>
                            <div class="extra">请统一上传比例为2:1的图片，宽200px，高100px（高清）</div>
                        </el-form-item>
                        <el-form-item label="商家电话" prop="contactMobile">
                            <TigInput classType="tig-form-input" v-model="formState.contactMobile"/>
                        </el-form-item>
                        <el-form-item label="店铺描述" prop="description">
                            <TigInput classType="tig-form-input" v-model="formState.description" :row="5" type="textarea"/>
                        </el-form-item>
                        <el-form-item v-show="!props.isDialog" :wrapper-col="{ offset: 4, span: 16 }">
                            <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit">提交</el-button>
                        </el-form-item>
                </el-form>
                <a-spin :spinning="loading" style="width:100%;margin-top:100px"/>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import {onMounted, ref, shallowRef} from "vue"
import {useRouter} from 'vue-router'
import {message} from "ant-design-vue";
import type {UserInvoiceFormState} from '@/types/finance/userInvoice.d';
import { FormAddGallery } from "@/components/gallery";
import {getUserInvoice, updateUserInvoice} from "@/api/finance/userInvoice";

import { ShopFormState } from "@/types/shop/shop.d";
import { getShop, updateShop } from "@/api/shop/shop";
// 父组件回调
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);

const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    act: {
        type: String,
        default: ''
    },
    isDialog: Boolean
});
const loading = ref<boolean>(false);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === 'add' ? 'create' : 'update';
const formRef = shallowRef();
const formState = ref<ShopFormState>({
});
const fetchShopInfo = async () => {
    try {
        const result = await getShop(action.value, {shopId: id.value});
        Object.assign(
          formState.value,
          result
        )
    } catch (error:any) {
        message.error(error.message);
        emit('close');
    } finally {
        loading.value = false;
    }
};


onMounted(() => {
    // 获取详情数据
    fetchShopInfo();
});

// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        emit('update:confirmLoading', true);
        const result = await updateShop(operation, {id: id.value, ...formState.value});
        emit('submitCallback', result);
        message.success("操作成功");
    } catch (error:any) {
        message.error(error.message);
    } finally {
        emit('update:confirmLoading', false);
    }
};
// 表单提交
const onFormSubmit = () => {
    onSubmit()
};

defineExpose({onFormSubmit});
</script>
<style scoped lang="less">

</style>
