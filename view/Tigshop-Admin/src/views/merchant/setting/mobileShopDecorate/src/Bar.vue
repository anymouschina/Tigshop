<template>
    <div v-if="module.image.picUrl" class="image-bar">
        <el-image :class="['box-size']" :src="imageFormat(module.image.picUrl)"></el-image>
    </div>
    <div class="controls-bar" :style="{backgroundColor:module.backgroundColor}">
        <div class="info-bar">
            <div class="left-bar">
                <div :style="{color:module.textColor}" class="bar-item">首页</div>
                <div :style="{color:module.textColor}" class="bar-item">全部分类<span class="iconfont icon-xiala"></span></div>
            </div>
            <div class="right-bar">
                <el-input
                    size="small"
                    v-model="input"
                    style="max-width: 240px"
                    placeholder="请输入关键字"
                >
                    <template #append>
                        <el-button class="query">搜索</el-button>
                    </template>
                </el-input>

            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import { imageFormat } from "@/utils/format";

const module = defineModel<any>("module", { type: Object, default: {} });

const input = ref("");
const menuList = ref([]);
const hoverColor = computed(() => {
    return module.value.hoverColor || "#333";
});
</script>
<style scoped lang="less">
.controls-bar {
    display: flex;
    width: 100%;
    background-color: #158FCE;
    height: 50px;
    align-items: center;
    justify-content: center;

    .info-bar {
        width: 85%;
        display: flex;
        justify-content: space-between;

        .left-bar {
            display: flex;
            gap: 18px;

            .bar-item {
                cursor: pointer;
                height: 30px;
                color: #FFFFFF;
                font-weight: bold;
                line-height: 40px;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 2px 20px;
                border-radius: 26px;
            }
            .bar-item:hover{
                background-color: v-bind("hoverColor") !important;
            }
        }

        .right-bar {
            display: flex;

            .query {
                background-color: #646464;
                color: white;
            }
        }
    }
}
</style>
