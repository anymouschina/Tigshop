<template>
    <div class="lyecs-popedit">
        <el-popover
            :visible="showPopover" 
            ref="popoverRef"
            placement="left"
            :width="0"
        >
            <template #reference>
                <div class="lyecs-popedit-con" @click="showPopover = true" v-click-outside="onClickOutside">
                    <slot></slot>
                    <span class="lyecs-popedit-btn iconfont icon-bianji1"></span>
                </div>
            </template>
            <template #default>
                <div class="table-product-box" v-if="skuList && skuList.length > 0">
                    <el-form :model="Form" :rules="rules" ref="formRef" class="formDiv">
                        <el-table :data="Form.skuList" style="width: 100%" border>
                                <el-table-column v-for="attr in skuTit" :label="attr.name">
                                    <template #default="{ row, $index }">
                                        <ul>
                                            <li v-for="(data, index) in row.skuData" :key="index">
                                                {{ attr.name == data.name ? data.value : ''}}
                                            </li>
                                        </ul>
                                    </template>
                                </el-table-column>
                                <el-table-column label="库存" width="100px">
                                    <template #default="{ row, $index }">
                                        <el-form-item :prop="'skuList.' + $index + '.skuStock'" :rules="rules.skuStock">
                                            <TigInput type="integer" v-model.trim="row.skuStock" placeholder="请输入商品库存"></TigInput>
                                        </el-form-item>
                                    </template>
                                </el-table-column>
                        </el-table>
                    </el-form>
                </div>
                <div class="table-product-inp" v-else>
                    <el-form :model="Form" :rules="rules" ref="formRef" class="formDiv">
                        <el-form-item prop="productStock" :rules="rules.productStock">
                            <TigInput type="integer" v-model.trim="Form.productStock" placeholder="请输入商品库存"></TigInput>
                        </el-form-item>
                    </el-form>
                </div>
                <div class="table-btn-box">
                    <el-button ref="buttonRef" @click="showPopover = false">取消</el-button>
                    <el-button v-if="skuList && skuList.length > 0" type="primary" @click="onConfirm({field: 'productSku'})" :loading="loading">保存</el-button>
                    <el-button v-else type="primary" @click="onConfirm({field: 'productStock'})" :loading="loading">保存</el-button>
                </div>
            </template>
        </el-popover>
    </div>
</template>
<script setup lang="ts">
import { ref, reactive, unref } from "vue"
import request from '@/utils/request'
import { message } from "ant-design-vue";
import type { FormRules } from 'element-plus'
import { ClickOutside as vClickOutside } from "element-plus"
const showPopover = ref(false);
const popoverRef = ref();
const loading = ref(false)
const onClickOutside = (e:any) => {
    if(showPopover.value && !unref(popoverRef).popperRef.contentRef.contains(e.target)) {
        showPopover.value = false;
    }
}

const props = defineProps({
    params: {
        type: Object,
        default: { id: null, productInfo: {} }
    },
    requestApi: { type: Function, default: request }
})

const Form = ref({
    skuList: props.params.productInfo.productSku || [],
    productStock: props.params.productInfo.productStock || 0
})

const skuTit = ref(Form.value.skuList[0]?.skuData)

const rules = ref({
    skuStock: [
    {
      required: true,
      message: '不能为空',
      trigger: 'blur',
    }
  ],
  productStock: [
    {
      required: true,
      message: '不能为空',
      trigger: 'blur',
    }
  ],
})

const emit = defineEmits(['callback'])
const formRef = ref();  //表单Ref
const visible = ref(false)
const skuList = ref(props.params.productInfo.productSku || []);
const onConfirm = (data: any) => {
    loading.value = true;
    return new Promise((resolve, reject) => {
        formRef.value.validate().then(() => {
            let val = null
            if(data.field == 'productSku'){
                val = extractSkuInfo(skuList.value)
            }else{
                val = Form.value.productStock
            }
            props.requestApi({
                id: props.params.id,
                field: data.field,
                val: val,
            }).then((result: any) => {
                emit('callback')
                message.success('操作成功')
                loading.value = false
                showPopover.value = false
                resolve(true);
            }).catch((error:any) => {
                loading.value = false
                message.error(error.message)
                reject();
            })
        })
    });
}

function extractSkuInfo(skus:any[]) {
  let skuInfoArray:any[] = [];
  skus.forEach((sku) => {
    skuInfoArray.push({ skuId: sku.skuId, skuStock: Number(sku.skuStock) });
  });
  return skuInfoArray;
}
</script>

<style lang="less" scoped>

.lyecs-popedit-con{
    cursor: pointer;
    display: flex;
    align-items: center;
    .lyecs-popedit-btn {
        cursor: pointer;
        color: #999;
        font-size: 16px;
        padding-left: 2px;
        line-height: 1;
    }
}
.table-btn-box{
    text-align: end;
    padding-top: 10px;
    padding-right: 10px;
}
.table-product-box{
    padding-right: 10px;
    height: 300px;
    overflow-y: scroll;
    overflow-x: hidden;
    &&::-webkit-scrollbar {
        //修改滚动条宽度或高度
        width: 8px;
    }
    &&::-webkit-scrollbar-thumb {
        border-radius: 20px;
        background: #c2c2c2;
    }
    &&::-webkit-scrollbar-track {
        border-radius: 8px;
        background: #fff;
    }
    :deep(.el-form-item){
        margin-bottom: 0 !important;
        width: 70px !important;
    }
}
.table-product-inp{
    :deep(.el-form-item){
        margin-bottom: 0 !important;
        width: 120px !important;
    }
}
</style>
