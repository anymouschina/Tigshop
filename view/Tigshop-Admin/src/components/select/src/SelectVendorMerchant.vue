<template>
    <el-select
      v-model="merchantId"
      :loading="loading"
      filterable
      :multiple="props.multiple"
      placeholder="请输入商户名称"
      clearable
      reserve-keyword
      @change="onChange">
        <el-option
          v-for="item in options"
          :key="item.merchantId"
          :label="item.companyName"
          :value="item.merchantId"
        />
    </el-select>
</template>
<script lang="ts" setup>
import {computed, onMounted, reactive, ref} from 'vue';
import {vendorShopBindMerchantList} from "@/api/vendor/bindShop";
import {message} from "ant-design-vue";
import type {ShopSelectFilterParams} from "@/types/shop/shop.d";

const props = defineProps({
    modelValue: {type: [Number,String]},
    multiple:{
        type:Boolean,
        default:false
    }
    //multiple 是否多选，可直接写在父组件
})
const loading = ref<boolean>(true);
const filterParams = reactive<ShopSelectFilterParams>({   //初使化用于查询的参数
    size: 30,
    keyword:""
});
const emit = defineEmits(['update:modelValue', 'onChange'])
const merchantId = defineModel<number|string|number[]>("merchantId");
const onChange = (e:any) => {
    emit('update:modelValue', e)
    emit('onChange', e)
}
onMounted(()=>{
    loadFilter()
})

const options: any = ref([])
const loadFilter = async (query?: number | string) => {
    loading.value = true;
    filterParams.keyword = String(query || '');
    try {
        const result = await vendorShopBindMerchantList({...filterParams});
        options.value = result.records;
    } catch (error:any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
}
</script>
<style lang="less" scoped>

</style>
