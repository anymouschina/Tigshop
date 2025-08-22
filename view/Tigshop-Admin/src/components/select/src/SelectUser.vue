<template>
    <el-select
        style="width: 100%"
        v-model="userId"
        :loading="loading"
        :remote-method="loadFilter"
        filterable
        :multiple="props.multiple"
        placeholder="请输入会员名称/手机号"
        remote
        remote-show-suffix
        reserve-keyword
    >
        <el-option
            v-for="item in options"
            :key="item.userId"
            :label="'会员名称：' + item.username + (item.mobile ? '（' + item.mobile + '）' : '')"
            :value="item.userId"
        />
    </el-select>
    <template v-if="showTips">
        <div class="extra">注意：搜索结果只显示前20条记录，如果没有找到相应会员，请更精确地查找；</div>
        <div class="extra">另外，如果该会员是从论坛注册的且没有在商城登录过，也无法找到，需要先在商城登录。</div>
    </template>
</template>
<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import { getUserList } from "@/api/user/user";
import { message } from "ant-design-vue";
import { UserFilterParams } from "@/types/user/user";

const props = defineProps({
    userId: { type: Number },
    username: { type: String, default: "" },
    showTips: { type: Boolean, default: false },
    multiple: { type: Boolean, default: true }
    //multiple 是否多选，可直接写在父组件
});
const loading = ref<boolean>(true);
const filterParams = reactive<UserFilterParams>({
    //初使化用于查询的参数
    page: 1,
    size: 20
});
const emit = defineEmits(["update:userId"]);
const userId = computed({
    get: () => props.userId,
    set: (newValue) => emit("update:userId", newValue)
});

const options: any = ref([]);
const loadFilter = async (query?: number | string) => {
    loading.value = true;
    filterParams.keyword = "";
    filterParams.keyword = String(query);
    try {
        const result = await getUserList({ ...filterParams });
        options.value = result.records;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
</script>
<style lang="less" scoped></style>
