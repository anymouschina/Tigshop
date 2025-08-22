<template>
    <div class="container">
        <div class="content_wrapper">
            <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                <el-form-item prop="type" label="页面样式：">
                    <div class="page_tab">
                        <div class="item" v-for="(item, index) in pagesList" @click="formState.type = index + 1">
                            <img :src="item.img" alt="" :class="{ active: formState.type == index + 1 }" />
                            <div class="title">{{ item.title }}</div>
                        </div>
                    </div>
                </el-form-item>
                <el-form-item label=" ">
                    <el-button class="btn" type="primary" @click="onSubmit()">保 存</el-button>
                    <el-button class="btn" @click="onReset()">重 置</el-button>
                </el-form-item>
            </el-form>
        </div>
    </div>
</template>

<script setup lang="ts">
import "@/style/css/list.less";
import { onMounted, ref } from "vue";
import { getConfigCategoryDecorate, saveConfigCategoryDecorate } from "@/api/setting/config";
import { message } from "ant-design-vue";
import classify1 from "@/assets/classify/classify1.png";
import classify2 from "@/assets/classify/classify2.png";
import classify3 from "@/assets/classify/classify3.png";
const pagesList = ref<any[]>([
    {
        title: "样式1",
        img: classify1
    },
    {
        title: "样式2",
        img: classify2
    },
    {
        title: "样式3",
        img: classify3
    }
]);
const formState = ref<any>({
    type: 1
});
const loading = ref<boolean>(true);
const loadFilter = async () => {
    try {
        const result = await getConfigCategoryDecorate();
        formState.value.type = result.productCategoryDecorateType
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
// 表单通过验证后提交
const onReset = async () => {
    formState.value.type = 1;
    onSubmit();
};
// 表单通过验证后提交
const onSubmit = async () => {
    try {
        const result = await saveConfigCategoryDecorate({
            productCategoryDecorateType: formState.value.type
        });
        message.success("操作成功");
        loadFilter();
    } catch (error: any) {
        message.error(error.message);
    }
};
onMounted(() => {
    // 获取详情数据
    loadFilter();
});
</script>
<style lang="less" scoped>
.page_tab {
    display: flex;
    flex-wrap: wrap;
    .item {
        width: 260px;
        margin-right: 40px;
        text-align: center;
        font-size: 14px;
        margin-bottom: 70px;
        img {
            width: 100%;
            margin-bottom: 10px;
            border: 2px solid #eee;
            border-radius: 10px;
        }
        .active {
            border: 2px solid var(--tig-primary);
            color: var(--tig-primary);
        }
    }
}
</style>
