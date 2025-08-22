<template>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">购买按钮</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="buyBtnStyle.showBtn">
                <el-radio-button :value="0">不显示</el-radio-button>
                <el-radio-button :value="1">显示</el-radio-button>
            </el-radio-group>
        </div>
    </div>
    <div v-if="buyBtnStyle.showBtn === 1">
        <div class="dec-edit-group bg-grey dec-edit-group-block">
            <div class="dec-edit-group-title">
                <div class="label">购买按钮图标样式</div>
                <div class="value"></div>
            </div>
            <div class="dec-edit-group-con">
                <el-radio-group class="dec-radio-group" v-model="buyBtnStyle.btnType">
                    <el-radio-button :value="0">不显示</el-radio-button>
                    <el-radio-button :value="1">样式一</el-radio-button>
                    <el-radio-button :value="2">样式二</el-radio-button>
                    <el-radio-button :value="3">样式三</el-radio-button>
                    <el-radio-button :value="4">样式四</el-radio-button>
                </el-radio-group>
            </div>
        </div>
        <div class="dec-edit-group bg-grey">
            <div class="dec-edit-group-title">
                <div class="label">文字内容</div>
            </div>
            <div class="dec-edit-group-con">
                <div class="dec-input-group">
                    <el-input v-model="buyBtnStyle.text" placeholder="请输入按钮文字内容"></el-input>
                </div>
            </div>
        </div>
        <div class="dec-edit-group bg-grey">
            <div class="dec-edit-group-title">
                <div class="label">文字颜色</div>
            </div>
            <div class="dec-edit-group-con">
                <div class="dec-color-group">
                    <div class="dec-color-button">
                        <a class="dec-color-reset" @click="buyBtnStyle.textColor = defaultBuyButtonStyle.textColor">重置</a>
                        <SelectColor v-model:color="buyBtnStyle.textColor"></SelectColor>
                    </div>
                </div>
            </div>
        </div>
        <div class="dec-edit-group bg-grey" v-if="buyBtnStyle.btnType !== 0">
            <div class="dec-edit-group-title">
                <div class="label">图标颜色</div>
            </div>
            <div class="dec-edit-group-con">
                <div class="dec-color-group">
                    <div class="dec-color-button">
                        <a class="dec-color-reset" @click="buyBtnStyle.iconColor = defaultBuyButtonStyle.iconColor">重置</a>
                        <SelectColor v-model:color="buyBtnStyle.iconColor"></SelectColor>
                    </div>
                </div>
            </div>
        </div>
        <div class="dec-edit-group bg-grey">
            <div class="dec-edit-group-title">
                <div class="label">背景渐变方向</div>
            </div>
            <div class="dec-edit-group-con">
                <el-radio-group class="dec-radio-group" v-model="buyBtnStyle.gradientType">
                    <el-tooltip effect="light" placement="bottom" content="上下" :show-after="100">
                        <el-radio-button :value="'upDown'">上下</el-radio-button>
                    </el-tooltip>
                    <el-tooltip effect="light" placement="bottom" content="左右" :show-after="100">
                        <el-radio-button :value="'leftRight'">左右</el-radio-button>
                    </el-tooltip>
                    <el-tooltip effect="light" placement="bottom" content="斜向" :show-after="100">
                        <el-radio-button :value="'diagonal'">斜向</el-radio-button>
                    </el-tooltip>
                    <el-tooltip effect="light" placement="bottom" content="纯色" :show-after="100">
                        <el-radio-button :value="'purity'">纯色</el-radio-button>
                    </el-tooltip>
                </el-radio-group>
            </div>
        </div>
        <div class="dec-edit-group bg-grey">
            <div class="dec-edit-group-title">
                <div class="label">背景渐变颜色</div>
                <div class="value"></div>
            </div>
            <div class="dec-edit-group-con">
                <div class="dec-color-group">
                    <div class="dec-color-button">
                        <a class="dec-color-reset" @click="resetColor">重置</a>
                        <div class="flex flex-align-center">
                            <div><SelectColor v-model:color="buyBtnStyle.gradientColorA"></SelectColor></div>
                            <div style="margin: 0 10px">-</div>
                            <div><SelectColor v-model:color="buyBtnStyle.gradientColorB"></SelectColor></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="dec-edit-group bg-grey">
            <div class="dec-edit-group-title">
                <div class="label">按钮圆角</div>
            </div>
            <div class="dec-edit-group-con">
                <div class="dec-range-group">
                    <el-slider v-model="buyBtnStyle.radius" show-input :show-input-controls="false" size="small" input-size="default" :max="20" />
                </div>
            </div>
        </div>
        <div class="dec-edit-group bg-grey">
            <div class="dec-edit-group-title">
                <div class="label">按钮高度</div>
            </div>
            <div class="dec-edit-group-con">
                <div class="dec-range-group">
                    <el-slider v-model="buyBtnStyle.paddingTopBottom" show-input :show-input-controls="false" size="small" input-size="default" :max="10" />
                </div>
            </div>
        </div>
        <div class="dec-edit-group bg-grey" v-if="buyBtnStyle.text !== ''">
            <div class="dec-edit-group-title">
                <div class="label">按钮宽度</div>
            </div>
            <div class="dec-edit-group-con">
                <div class="dec-range-group">
                    <el-slider v-model="buyBtnStyle.paddingLeftRight" show-input :show-input-controls="false" size="small" input-size="default" :max="10" />
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref, PropType } from "vue";
import { SelectColor } from "@/components/select";
import { BuyButtonStyleType } from "@/types/decorate/decorate.d";
import { defaultBuyButtonStyle } from "@/views/decorate/decorate/src/modules/";
const buyBtnStyle = defineModel<BuyButtonStyleType>("modelValue", { default: () => ({}) });
type typeString = "categoryA1" | "category_A2";
const props = defineProps({
    type: {
        type: String as PropType<typeString>,
        default: "categoryA1"
    }
});
const resetColor = () => {
    buyBtnStyle.value.gradientColorA = defaultBuyButtonStyle.gradientColorA;
    buyBtnStyle.value.gradientColorB = defaultBuyButtonStyle.gradientColorB;
};
</script>
