<template>
    <div class="bar-container">
        <div class="left-bar">
            <Bar v-model:module="module"></Bar>
        </div>
        <div class="right-bar">
            <div class="title">
                添加店铺头部图
            </div>
            <div class="pic-change-desc">
                高度为110px（高清图为220px），宽度1500px（高清图为3000px）
            </div>
            <ImageCard v-model:photo="module.image"></ImageCard>
            <div class="dec-edit-group">
                <div class="dec-edit-group-title">
                    <div class="label">页面导航是否显示子级</div>
                </div>
                <div class="dec-edit-group-con">
                    <el-radio-group class="dec-radio-group" v-model="module.showSublevel">
                        <el-radio-button :value="1">显示</el-radio-button>
                        <el-radio-button :value="2">不显示</el-radio-button>
                    </el-radio-group>
                </div>
            </div>
            <div class="dec-edit-group">
                <div class="dec-edit-group-title">
                    <div class="label">导航条背景颜色</div>
                </div>
                <div class="dec-edit-group-con">
                    <div class="dec-color-button">
                        <a class="dec-color-reset" @click="module.backgroundColor = ''">重置</a>
                        <SelectColor v-model:color="module.backgroundColor"></SelectColor>
                    </div>
                </div>
            </div>
            <div class="dec-edit-group">
                <div class="dec-edit-group-title">
                    <div class="label">导航条文字颜色</div>
                </div>
                <div class="dec-edit-group-con">
                    <div class="dec-color-button">
                        <a class="dec-color-reset" @click="module.textColor = ''">重置</a>
                        <SelectColor v-model:color="module.textColor"></SelectColor>
                    </div>
                </div>
            </div>
            <div class="dec-edit-group">
                <div class="dec-edit-group-title">
                    <div class="label">文字悬停背景色</div>
                </div>
                <div class="dec-edit-group-con">
                    <div class="dec-color-button">
                        <a class="dec-color-reset" @click="module.hoverColor = ''">重置</a>
                        <SelectColor v-model:color="module.hoverColor"></SelectColor>
                    </div>
                </div>
            </div>
            <div class="sub">
                <el-button @click="onSubmit" type="primary" size="large">提交</el-button>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">

import Bar from "@/views/merchant/setting/mobileShopDecorate/src/Bar.vue";
import { onMounted, ref } from "vue";

import ImageCard from "@/views/merchant/setting/mobileShopDecorate/src/ImageCard.vue";
import { SelectColor } from "@/components/select";
import { defaultTitle } from "@/views/decorate/decorate/src/modules";
import { getDecorateDiscrete, updateDecorateDiscrete } from "@/api/decorate/decorateDiscrete";
import { message } from "ant-design-vue";

const module = ref({
    image: "",
    showSublevel: 1,
    backgroundColor: "",
    textColor: "",
    hoverColor: "",
});
const loading = ref(true);

onMounted(() => {
    // 获取详情数据
    fetchDecorateDiscrete();
});
const fetchDecorateDiscrete = async () => {
    try {
        const result = await getDecorateDiscrete({
            decorateSn: "shopHead"
        });
        if(result && result.data){
            Object.assign(module.value, result.data);
        }
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
const confirmLoading = ref(false);
const onSubmit = async () => {
    try {
        confirmLoading.value = true;
        const result = await updateDecorateDiscrete({
            decorateSn: "shopHead",
            data: module.value
        });
        message.success("操作成功");
    } catch (error: any) {
        message.error(error.message);
    } finally {
        confirmLoading.value = false;
    }
};

</script>
<style scoped lang="less">
.bar-container {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .left-bar {
        flex: 1;
        border-radius: 2px;
    }

    .right-bar {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;

        .title {
            margin-right: 16px;
            font-size: 14px;
            color: #323233;
            line-height: 18px;
            white-space: nowrap;
        }


        .pic-change-desc {
            font-size: 12px;
            line-height: 18px;
            color: #999;

        }

        .dec-edit-group {
            padding: 12px 16px;
            display: flex;
            flex-direction: row;
            justify-content: flex-start;

            .dec-edit-group-title {
                display: flex;
                align-items: flex-start;
                padding-top: 8px;

                .label {
                    margin-right: 16px;
                    font-size: 14px;
                    color: #969799;
                    line-height: 18px;
                    white-space: nowrap;
                }
            }

            .dec-edit-group-con {
                flex: 1;
                display: flex;
                justify-content: flex-end;
                align-items: center;

                .dec-color-button {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
            }
        }

        .sub{
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
}
</style>
