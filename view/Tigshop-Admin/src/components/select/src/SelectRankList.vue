<template>
    <el-select v-model="rankId">
        <el-option
          :key="0"
          label="请选择..."
          :value="0"
        />
        <el-option
          v-for="item in options"
          :key="item.rankId"
          :label="item.rankName"
          :value="item.rankId"
        />
    </el-select>
</template>
<script lang="ts" setup>
import {getUserRankList} from "@/api/user/userRank";
import {message} from "ant-design-vue";
import {computed, onMounted, reactive, ref} from "vue";
import {UserRankFilterParams,UserRankFilterState} from "@/types/user/userRank";

const props = defineProps({
    modelValue: {type: Number},
})
const emit = defineEmits([
    "update:modelValue",
])
const rankId = computed({
    get: () => {
        return props.modelValue
    },
    set: (newValue) => {
        emit('update:modelValue', newValue)
    }
})

const filterParams = reactive<UserRankFilterParams>({   //初使化用于查询的参数
    sortField: '',
    sortOrder: '',
});
const options = ref<UserRankFilterState[]>([])
const loadFilter = async () => {
    try {
        const result = await getUserRankList({...filterParams});
        options.value = result.userRank.records;

    } catch (error:any) {
        message.error(error.message);
    } finally {

    }
}
onMounted(() => {
    loadFilter();
});
</script>
<style lang="less" scoped>

</style>
