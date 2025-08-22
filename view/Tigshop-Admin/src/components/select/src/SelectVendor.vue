<template>
    <el-select
      v-model="vendorId"
      :loading="loading"
      filterable
      :multiple="props.multiple"
      placeholder="请输入供应商名称"
      clearable
      remote
      reserve-keyword
      :remote-method="loadFilter"
      @change="onChange">
        <el-option
          v-for="item in options"
          :key="item.vendorId"
          :label="item.vendorName"
          :value="item.vendorId"
        />
    </el-select>
</template>
<script lang="ts" setup>
import {computed, onMounted, reactive, ref} from 'vue';
import { getSuppliersList } from "@/api/vendor/suppliers";
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
    keyword:"",
    size:30
});
const emit = defineEmits(['update:modelValue', 'onChange'])
const vendorId = defineModel<number|string|number[]>("vendorId");
const onChange = (e:any) => {
    emit('update:modelValue', e)
    emit('onChange', e)
}
onMounted(()=>{
    loadFilter()
})

const options: any = ref([
    {
        vendorId: -2,
        vendorName: "全部供应商"
    }
])
const loadFilter = async (query?: number | string) => {
    loading.value = true;
    filterParams.keyword = String(query || '');
    try {
        const result = await getSuppliersList({...filterParams});
        options.value.length = 0
        options.value.push(...result.records);
    } catch (error:any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
}
</script>
<style lang="less" scoped>

</style>
