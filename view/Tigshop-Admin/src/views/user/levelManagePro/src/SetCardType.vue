<template>
    <div class="container flex">
        <el-form ref="formRef" :model="data" label-width="auto">
            <el-form-item prop="name" label="背景设置：">
                <el-radio-group v-model="data.rankCardType">
                    <el-radio :value="1" size="large">背景色</el-radio>
                </el-radio-group>
                <div class="card-check" :class="{ active: isShow }" ref="buttonRef" v-click-outside="onClickOutside">
                    <div class="card" :class="data.rankIco"></div>
                </div>
                <el-popover ref="popoverRef" width="200px" :virtual-ref="buttonRef" trigger="click" virtual-triggering @show="onShow" @hide="onHide">
                    <div class="card-list">
                        <div class="card-item" v-for="item in cardList" :class="item" @click="changeCard(item)"></div>
                    </div>
                </el-popover>
            </el-form-item>
            <el-form-item prop="name" label=" ">
                <el-radio-group v-model="data.rankCardType">
                    <el-radio :value="2" size="large">自定义图片</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item prop="name" label=" ">
                <FormAddGallery v-model:photo="data.rankBg"></FormAddGallery>
                <div class="extra">尺寸：1000*525像素，小于1M，支持jpg、png、jpeg格式</div>
            </el-form-item>
        </el-form>
        <div v-if="data.rankBg !== '' && data.rankCardType == 2" class="card-bg" :style="{backgroundImage: 'url('+data.rankBg+')'}">
            黄金会员
        </div>
        <div v-else class="card-bg" :class="data.rankIco">
            黄金会员
        </div>
    </div>
</template>
<script setup lang="ts">
import "./card.less";
import { FormAddGallery } from "@/components/gallery";
import { ref, unref } from "vue";
import { ClickOutside as vClickOutside } from "element-plus";
const emit = defineEmits(["submitCallback", "update:confirmLoading", "close"]);
const buttonRef = ref();
const popoverRef = ref();
const onClickOutside = () => {
    unref(popoverRef).popperRef?.delayHide?.();
};
const props = defineProps({
    data: {
        type: Object,
        default: {}
    }
});
const cardList = ["card1", "card2", "card3", "card4", "card5", "card6", "card7", "card8", "card9"];
const isShow = ref(false);
const onShow = () => {
    isShow.value = true;
};
const onHide = () => {
    isShow.value = false;
};
const changeCard = (item: string) => {
    props.data.rankIco = item;
};
// 表单通过验证后提交
const onSubmit = async () => {
    emit("submitCallback", props.data);
};
// 表单提交
const onFormSubmit = () => {
    onSubmit();
};

defineExpose({ onFormSubmit });
</script>
<style scoped lang="less">
body .el-form-item {
    margin-bottom: 0px;
}
.card-bg{
    width: 343px;
    height: 180px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: bold;
    box-sizing: border-box;
    padding: 17px 20px;
    color: #fff;
    position: relative;
    overflow: visible;
    background-repeat: no-repeat;
    background-position: 0% 0%;
    background-size: cover;
}
.card-check {
    width: 55px;
    height: 28px;
    border: 1px solid #ccc;
    border-radius: 2px;
    margin-left: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    .card {
        width: 45px;
        height: 20px;
    }
    .card1 {
        background: #75b06d;
    }
    .card2 {
        background: #47a779;
    }
    .card3 {
        background: #6ab7de;
    }
    .card4 {
        background: #6385bd;
    }
    .card5 {
        background: #9b6fc8;
    }
    .card6 {
        background: #c0996f;
    }
    .card7 {
        background: #eec154;
    }
    .card8 {
        background: #de5850;
    }
    .card9 {
        background: #798795;
    }
}
.card-list {
    width: 180px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    .card-item {
        width: 20px;
        height: 20px;
        background-color: red;
        border: 1px solid #ccc;
        &:hover {
            border: 1px solid #409eff;
        }
    }
    .card1 {
        background: #75b06d;
    }
    .card2 {
        background: #47a779;
    }
    .card3 {
        background: #6ab7de;
    }
    .card4 {
        background: #6385bd;
    }
    .card5 {
        background: #9b6fc8;
    }
    .card6 {
        background: #c0996f;
    }
    .card7 {
        background: #eec154;
    }
    .card8 {
        background: #de5850;
    }
    .card9 {
        background: #798795;
    }
}
.active {
    border: 1px solid #409eff;
}
</style>
