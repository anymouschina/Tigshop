<template>
    <el-cascader placement="right" style="width:100%" :props="cascaderProps" placeholder="请选择地区" :options="options" v-model="ids" clearable @change="onChange" @clear="onClear" />
</template>
<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRegionStore } from "@/store/region";
import { message } from "ant-design-vue";
const region = useRegionStore();
// 传值
const props = defineProps({
    modelValue: { type: [Array], default: [] },
    checkStrictly: { type: Boolean, default: false }
})
const cascaderProps = {
    checkStrictly: props.checkStrictly,
    label: 'regionName', value: 'regionId', children: 'children'
}
//选项卡
const options = ref([]);
const loaded = ref(false)
// 当前值
const ids = ref(props.modelValue)
// 给父组件传值
const emit = defineEmits(['update:modelValue'])
// 加载分类
onMounted(() => {
    if(region.allRegion == null){
        loadRegion()
    }else{
        options.value = region.allRegion
    }
});
const loadRegion = async () => {
    if (loaded.value) {
        return;
    }
    ids.value = props.modelValue || [];
    loaded.value = true
    try {
        await (region as any).getRegionList();
        options.value = (region as any).allRegion;
    } catch (error:any) {
        message.error(error.message);
    } finally {
        loaded.value = false
    }
}
const onChange = (ids:any) => {
    emit('update:modelValue', ids)
}
const onClear = () => {
    ids.value = [];

}
</script>
<style lang="less" scoped>
.cascader {
    width: 100%;
}
</style>
