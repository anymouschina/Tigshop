<template>
    <el-select
        v-model="modelValue"
        filterable
    >
        <el-option
            v-for="item in options"
            :key="item.adminId"
            :label="item.username"
            :value="item.adminId"
        />
    </el-select>
</template>
<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { getAdminUserList } from "@/api/authority/adminUser";
import { message } from "ant-design-vue";
import {AdminUserFilterState} from "@/types/authority/adminUser"

const modelValue = defineModel({
    default: () => 0,
    type: [String]
});
const options = ref<AdminUserFilterState[]>();

onMounted(() => {
    getUserList();
});
const filterParams = reactive({
    page: 1,
    size: 999,
});
const getUserList = async () => {
    try {
        options.value = [
            {
                adminId: -1,
                username: "全部客服"
            }
        ]
        const result = await getAdminUserList({ ...filterParams });
        options.value.push(...result.records)
    } catch (error: any) {
        message.error(error.message);
    } finally {
    }
};
</script>
<style scoped lang="less">

</style>
