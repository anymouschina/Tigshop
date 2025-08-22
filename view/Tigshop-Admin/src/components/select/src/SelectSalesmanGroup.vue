<template>
    <div class="container">
        <el-select
            v-model="groupId"
            placeholder="请选择分组"
            clearable
            @change="emit('onChange', $event)"
            >
            <el-option
                v-for="item in filterState"
                :key="item.groupId"
                :label="item.groupName"
                :value="item.groupId"
            />
            </el-select>
    </div>
</template>

<script setup lang="ts">
import '@/style/css/list.less'
import { ref, reactive, onMounted, defineModel } from 'vue';
import { message } from 'ant-design-vue'
import type {groupFilterState, groupFilterParams} from "@/types/salesman/subgroup.d";
import {getgroupList} from "@/api/salesman/subgroup";
const emit = defineEmits(['onChange'])
const groupId = defineModel<any>("groupId");
// 基本参数定义
const filterState = ref<groupFilterState[]>();
const filterParams = reactive<groupFilterParams>({
    page: 1,
    size: 9999,
    sortField: '',
    sortOrder: '',
    groupName: '',
});
// 获取列表的查询结果
const loadFilter = async () => {
    try {
        const result = await getgroupList({ ...filterParams });
        filterState.value = result.records;
    } catch (error:any) {
        message.error(error.message);
    }
}
onMounted(() => {
    loadFilter();
});

</script>