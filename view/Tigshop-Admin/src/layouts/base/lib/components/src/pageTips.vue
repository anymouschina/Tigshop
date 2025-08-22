<template>
    <div class="page-tips-wrapper">
        <div class="tips-list">
            <template v-for="item in tipsList">
                <div class="tips-item" v-if="item.status">
                    <div class="info flex flex-align-center">
                        <div class="icon mr10">
                            <el-icon size="18" color="#ed6a18"><WarnTriangleFilled /></el-icon>
                        </div>
                        <div class="tips-content" v-if="item.code == 'passwordTooSimple'" >
                            您的密码强度不足，可能存在安全风险，建议立即修改。
                            <a @click="toPage('/authority/account-editing/index')">点击修改</a>
                        </div>
                        <div class="tips-content" v-if="item.code == 'domainBind'">
                            您当前使用的是默认后台路径，存在暴露风险，为保证系统安全，强烈建议绑定后台域名，请阅读 
                            <a href="https://www.tigshop.com/course/tigshop/657501281266631138" target="_blank">
                                《绑定后台域名教程》
                            </a>
                            后进行绑定。
                        </div>
                    </div>
                    <div class="btn" @click.stop="item.status = false">
                        <el-icon size="18"><Close /></el-icon>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { getTipsList } from "@/api/common/common";
import { WarnTriangleFilled, Close } from "@element-plus/icons-vue";
const router = useRouter();
const tipsList = ref<any[]>([]);
const _getTipsList = async () => {
    try {
        const result = await getTipsList({ url: window.location.href });
        tipsList.value = result;
    } catch (error: any) {
    } finally {
    }
};
_getTipsList();
const toPage = (path: any) => {
    router.push({
        path
    });
};
</script>
<style scoped lang="less">
.page-tips-wrapper {
    padding: 0px 16px 0 16px;
    .tips-list{
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    .tips-item {
        border: #ffe6d7 1px solid;
        cursor: pointer;
        background-color: #ffefe6;
        padding:10px 20px;
        line-height: 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        .icon,.btn{
            margin-top: 5px;
        }
    }
}
</style>
