<template>
    <div class="dec-edit-title-box">
        <div class="title">内容区样式设置</div>
    </div>
    <div class="dec-edit-group" v-if="type === 'noticeA2'">
        <div class="dec-edit-group-title">
            <div class="label">内容区上下间距</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="contentStyle.paddingTopBottom" show-input :show-input-controls="false" size="small" input-size="default" :max="40" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type === 'categoryA2'">
        <div class="dec-edit-group-title">
            <div class="label">内容区上间距</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="contentStyle.paddingTop" show-input :show-input-controls="false" size="small" input-size="default" :max="40" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type === 'categoryA2'">
        <div class="dec-edit-group-title">
            <div class="label">内容区下间距</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="contentStyle.paddingBottom" show-input :show-input-controls="false" size="small" input-size="default" :max="40" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type === 'categoryA2' || type === 'noticeA2'">
        <div class="dec-edit-group-title">
            <div class="label">内容区左右间距</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="contentStyle.paddingLeftRight" show-input :show-input-controls="false" size="small" input-size="default" :max="20" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type === 'imageTextComponent' || type === 'categoryA1' || type === 'mixedProductDisplay' || type === 'productGrouping'">
        <div class="dec-edit-group-title">
            <div class="label">内容区内部间距</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="contentStyle.padding" show-input :show-input-controls="false" size="small" input-size="default" :max="40" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type !== 'imageTextComponent' && type !== 'article' && type !== 'noticeA2' && type !== 'specialOffer' && type !== 'mixedProductDisplay' && type !== 'countdown' && type !== 'customProduct'">
        <div class="dec-edit-group-title">
            <div class="label">内容区上部圆角</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="contentStyle.boxRadiusTop" show-input :show-input-controls="false" size="small" input-size="default" :max="40" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type !== 'imageTextComponent' && type !== 'article' && type !== 'noticeA2' && type !== 'specialOffer' && type !== 'mixedProductDisplay' && type !== 'countdown' && type !== 'customProduct'">
        <div class="dec-edit-group-title">
            <div class="label">内容区下部圆角</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="contentStyle.boxRadiusBottom" show-input :show-input-controls="false" size="small" input-size="default" :max="40" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type === 'imageTextComponent' || type === 'article' || type === 'noticeA2' || type === 'specialOffer' || type === 'mixedProductDisplay' || type === 'countdown' || type === 'customProduct'">
        <div class="dec-edit-group-title">
            <div class="label">内容区圆角半径</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="contentStyle.boxRadius" show-input :show-input-controls="false" size="small" input-size="default" :max="40" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type !== 'imageTextComponent' && type !== 'noticeA2' && type !== 'customProduct'">
        <div class="dec-edit-group-title">
            <div class="label">背景渐变方向</div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="contentStyle.gradientType">
                <el-tooltip effect="light" placement="bottom" content="上下" :show-after="100">
                    <el-radio-button :value="'upDown'">上下</el-radio-button>
                </el-tooltip>
                <el-tooltip effect="light" placement="bottom" content="左右" :show-after="100">
                    <el-radio-button :value="'leftRight'">左右</el-radio-button>
                </el-tooltip>
                <el-tooltip effect="light" placement="bottom" content="斜向" :show-after="100">
                    <el-radio-button :value="'diagonal'">斜向</el-radio-button>
                </el-tooltip>
                <el-tooltip v-if="type === 'slideLargeImage'" effect="light" placement="bottom" content="纯色" :show-after="100">
                    <el-radio-button :value="'purity'">纯色</el-radio-button>
                </el-tooltip>
            </el-radio-group>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type !== 'imageTextComponent' && type !== 'noticeA2' && type !== 'customProduct'">
        <div class="dec-edit-group-title">
            <div class="label">背景渐变颜色</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-color-group">
                <div class="dec-color-button">
                    <a class="dec-color-reset" @click="resetColor">重置</a>
                    <div class="flex flex-align-center">
                        <div><SelectColor v-model:color="contentStyle.gradientColorA"></SelectColor></div>
                        <div style="margin: 0 10px">-</div>
                        <div><SelectColor v-model:color="contentStyle.gradientColorB"></SelectColor></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type === 'imageTextComponent' || type === 'noticeA2' || type === 'customProduct'">
        <div class="dec-edit-group-title">
            <div class="label">内容区背景颜色</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-color-group">
                <div class="dec-color-button">
                    <a class="dec-color-reset" @click="contentStyle.backgroundColor = defaultContentStyle.backgroundColor">重置</a>
                    <div class="flex flex-align-center">
                        <SelectColor v-model:color="contentStyle.backgroundColor"></SelectColor>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div v-if="type !== 'imageTextComponent' && type !== 'article' && type !== 'noticeA2' && type !== 'specialOffer' && type !== 'mixedProductDisplay' && type !== 'countdown' && type !== 'productGrouping' && type !== 'customProduct'">
        <div class="dec-edit-group">
            <div class="dec-edit-group-title">
                <div class="label">内容区背景图片</div>
            </div>
            <div class="dec-edit-group-con">
                <div class="dec-color-group">
                    <div class="dec-color-button">
                        <PicSelect v-model:photo="contentStyle.backgroundPic" v-model:defaultValue="defaultContentStyle.backgroundPic"></PicSelect>
                    </div>
                </div>
            </div>
        </div>
        <div class="dec-edit-group">
            <div class="dec-edit-group-title">
                <div class="label">背景图片填充</div>
                <div class="value">{{ selectLabel.picFillType[contentStyle.backgroundPicFillType as PicFillType] }}</div>
            </div>
            <div class="dec-edit-group-con">
                <el-radio-group class="dec-radio-group" v-model="contentStyle.backgroundPicFillType">
                    <el-tooltip effect="light" placement="bottom" content="填充" :show-after="100">
                        <el-radio-button :value="'cover'"><i class="iconfont-admin icon-tianchong"></i></el-radio-button>
                    </el-tooltip>
                    <el-tooltip effect="light" placement="bottom" content="周边留白" :show-after="100">
                        <el-radio-button :value="'contain'"><i class="iconfont-admin icon-liubai"></i></el-radio-button>
                    </el-tooltip>
                </el-radio-group>
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type !== 'imageTextComponent' && type !== 'article' && type !== 'productGrouping'">
        <div class="dec-edit-group-title">
            <div class="label">内容区投影</div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="contentStyle.boxShadow">
                <el-tooltip effect="light" placement="bottom" content="显示" :show-after="100">
                    <el-radio-button :value="1">显示</el-radio-button>
                </el-tooltip>
                <el-tooltip effect="light" placement="bottom" content="不显示" :show-after="100">
                    <el-radio-button :value="0">不显示</el-radio-button>
                </el-tooltip>
            </el-radio-group>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import { SelectColor } from "@/components/select";
import { PicSelect } from "@/components/decorate";
import { ContentStyleType } from "@/types/decorate/decorate.d";
import { defaultContentStyle } from "@/views/decorate/decorate/src/modules/";
import { PicFillType, GradientType } from "@/types/decorate/decorate.d";
import { selectLabel } from "@/views/decorate/decorate/src/modules/editIndex";
const contentStyle = defineModel<ContentStyleType>("modelValue", { default: () => ({}) });
const props = defineProps({
    type: {
        type: String,
        default: ""
    }
});
const resetColor = () => {
    contentStyle.value.gradientColorA = defaultContentStyle.gradientColorA;
    contentStyle.value.gradientColorB = defaultContentStyle.gradientColorB;
};
</script>
