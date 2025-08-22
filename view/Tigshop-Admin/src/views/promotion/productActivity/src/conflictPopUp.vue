<template>
    <div class="conflict-pop-up">
        <el-table :data="conflictList">
            <el-table-column prop="promotionName" label="活动名称" width="150" />
            <el-table-column prop="name" label="活动重合时间" width="300">
                <template #default="{ row }">
                    {{ row.startTime }} 至 {{ row.endTime }}
                </template>
            </el-table-column>
            <el-table-column prop="promotionTypeName" label="活动类型" />
        </el-table>
    </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
const props = defineProps({
    conflictList: {
        type: Array,
        default: []
    }
});
</script>
<style lang="less" scoped>
.conflict-pop-up{
    :deep(.el-dialog__body){
        min-height: 300px;
    }
}
</style>

