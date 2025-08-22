<template>
    <div class="container">
        <div class="content_wrapper decoratePgaeWrap">
            <div class="flex box-wrapper">
                <div class="tab-box">
                    <div class="flex">
                        <a-spin :spinning="loading">
                            <div class="decorateWrap">
                                <div class="decorate-page-window" style="margin-top: 10px">
                                    <div class="theme-modules-warp" v-if="!loading">
                                        <div class="top-img">
                                            <img src="@/style/images/decorate/user/decorate-bg.png">
                                        </div>
                                        <div v-for="(element, index) in toolList">
                                            <Modules
                                                :class="{'active': index == type}"
                                                @click="type = index"
                                                v-if="element.type"
                                                :module="element.module"
                                                :moduleType="element.type"></Modules>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </a-spin>
                        <div class="right-box-warp" style="width: 510px">
                            <a-spin :spinning="loading">
                                <div v-for="(element, index) in toolList">
                                    <ModulesEdit
                                        v-if="index == type"
                                        v-model:module="element.module"
                                        v-model:moduleType="element.type"></ModulesEdit>
                                </div>
                                
                            </a-spin>
                            <div class="dec-edit-save"  v-if="!loading">
                                <el-button :loading="confirmLoading" @click="onSubmit" type="primary" size="large" class="save-btn">保存</el-button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import "@/views/decorate/decorate/src/css/decorate.less";
import { ref, onMounted } from "vue";
import { getDecorateDiscrete, updateDecorateDiscrete, getMenberDecorateData } from "@/api/decorate/decorateDiscrete";
import { DecorateUserFormState } from "@/types/decorate/decorateDiscrete.d";
import { message } from "ant-design-vue";
import Modules from "./Module.vue";
import ModulesEdit from "./ModuleEdit.vue";
const loading = ref(true);
const confirmLoading = ref(false);

const toolList = ref<DecorateUserFormState[]>([
    { type: "bannerList", label: "广告位", module: {bannerList:{picUrl:""}} },
    { type: "menus", label: "用户服务", module: {menuType:1, menuList:[]} },
]);
const type = ref(0);
// 表单通过验证后提交
onMounted( async () => {
    // 获取详情数据
    await _getMenberDecorateData()
    await fetchDecorateDiscrete();
});
const menus = ref<any>([]);
const _getMenberDecorateData = async () => {
    try {
        const result = await getMenberDecorateData();
        menus.value = result.menus;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
const fetchDecorateDiscrete = async () => {
    try {
        const result = await getDecorateDiscrete({
            decorateSn: 'memberDecorate'
        });
        if(result && result.data){
            toolList.value = result.data;
        }
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
const onSubmit = async (newNumber?: number) => {
    try {
        confirmLoading.value = true;
        const result = await updateDecorateDiscrete({
            decorateSn: 'memberDecorate',
            data: toolList.value
        });
        if (newNumber !== 1) {
            message.success("操作成功");
        }
    } catch (error: any) {
        message.error(error.message);
    } finally {
        confirmLoading.value = false;
    }
};
</script>
<style lang="less" scoped>
.mx-1 {
    margin: 5px;
    cursor: pointer;
}
.right-box-warp{
    :deep(.el-tag){
        border: none !important;
        background-color: #f2f2f2 !important;
        color: #666 !important;
    }
}
.decorate-page-window{
    background: linear-gradient(90deg, #fcf6fc, #f3f3fe);
    padding: 1px;
}
.theme-modules-warp{
    .top-img{
        img{
            width: 100%;
        }
    }
    .active{
        &::before{
            border: 2px solid #155bd4 !important;
            display: block;
            left: -2px;
            right: -2px;
        }
    }

}
</style>
