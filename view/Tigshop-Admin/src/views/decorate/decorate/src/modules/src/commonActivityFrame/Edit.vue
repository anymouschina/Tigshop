<template>
    <!-- 结构设置 -->
    <div class="dec-edit-group dec-edit-group-block" v-if="type != 'product'">
        <div class="dec-edit-group-title">
            <div class="label">选择模板</div>
            <div class="value">{{ selectLabel.style[frame.style || ""] }}</div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="frame.style">
                <el-radio-button :value="1">一行一个</el-radio-button>
                <el-radio-button :value="2">一行两个</el-radio-button>
                <el-radio-button :value="5">详细列表</el-radio-button>
                <el-radio-button :value="6">横向滑动</el-radio-button>
            </el-radio-group>
        </div>
    </div>
    <div class="dec-divider-line" v-if="type != 'product'"></div>
    <CommonProductEdit v-if="type == 'product'" v-model="frame.products"></CommonProductEdit>
    <div class="dec-edit-group dec-edit-group-block">
        <div class="dec-edit-group-title">
            <div class="label">商品卡样式</div>
            <div class="value">{{ selectLabel.goodsStyle[frame.goodsStyle || ""] }}</div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="frame.goodsStyle">
                <el-radio-button :value="1">标准</el-radio-button>
                <el-radio-button :value="2">投影</el-radio-button>
                <el-radio-button :value="3">描边</el-radio-button>
                <el-radio-button :value="4">透明底</el-radio-button>
            </el-radio-group>
        </div>
    </div>
    <div class="dec-edit-group" v-if="frame.style === 2">
        <div class="dec-edit-group-title">
            <div class="label">瀑布流</div>
            <div class="value">{{ selectLabel.waterfall[frame.waterfall || 0] }}</div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="frame.waterfall">
                <el-radio-button :value="1">启用</el-radio-button>
                <el-radio-button :value="0">否</el-radio-button>
            </el-radio-group>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">商品卡边角</div>
            <div class="value">{{ selectLabel.goodsRadioStyle[frame.goodsRadioStyle || ""] }}</div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="frame.goodsRadioStyle">
                <el-radio-button :value="1">直角</el-radio-button>
                <el-radio-button :value="2">圆角</el-radio-button>
            </el-radio-group>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">文本对齐</div>
            <div class="value">{{ selectLabel.textAlign[frame.textAlign || ""] }}</div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="frame.textAlign">
                <el-radio-button :value="1">左对齐</el-radio-button>
                <el-radio-button :value="2">居中对齐</el-radio-button>
            </el-radio-group>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">文字粗细</div>
            <div class="value">{{ selectLabel.textWeight[frame.textWeight || ""] }}</div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="frame.textWeight">
                <el-radio-button :value="1">常规体</el-radio-button>
                <el-radio-button :value="2">加粗体</el-radio-button>
            </el-radio-group>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">商品名称行数</div>
            <div class="value">{{ selectLabel.goodsNameRow[frame.goodsNameRow || ""] }}</div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="frame.goodsNameRow">
                <el-radio-button :value="1">1行</el-radio-button>
                <el-radio-button :value="2">2行</el-radio-button>
            </el-radio-group>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">商品信息边距</div>
            <div class="value">{{ selectLabel.goodsNamePadding[frame.goodsNamePadding || ""] }}</div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="frame.goodsNamePadding">
                <el-radio-button :value="1">有边距</el-radio-button>
                <el-radio-button :value="0">无边距</el-radio-button>
            </el-radio-group>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">显示商品名称</div>
            <div class="value">{{ selectLabel.showName[frame.showName || ""] }}</div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="frame.showName">
                <el-radio-button :value="1">显示</el-radio-button>
                <el-radio-button :value="0">不显示</el-radio-button>
            </el-radio-group>
        </div>
    </div>
    <!-- <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">显示商品描述</div>
            <div class="value">{{ selectLabel.showBrief[frame.showBrief || ""] }}</div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="frame.showBrief">
                <el-radio-button :value="1">显示</el-radio-button>
                <el-radio-button :value="0">不显示</el-radio-button>
            </el-radio-group>
        </div>
    </div> -->
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">显示商品价格</div>
            <div class="value">{{ selectLabel.showPrice[frame.showPrice || ""] }}</div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="frame.showPrice">
                <el-radio-button :value="1">显示</el-radio-button>
                <el-radio-button :value="0">不显示</el-radio-button>
            </el-radio-group>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">商品边距</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="frame.goodsPadding" show-input :show-input-controls="false" size="small" input-size="default" :max="50" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group dec-edit-group-block">
        <div class="dec-edit-group-title">
            <div class="label">购买按钮样式</div>
            <div class="value">{{ selectLabel.buyBtnStyle[frame.buyBtnStyle || ""] }}</div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="frame.buyBtnStyle">
                <el-radio-button :value="0">不显示</el-radio-button>
                <el-radio-button :value="1">样式一</el-radio-button>
                <el-radio-button :value="2">样式二</el-radio-button>
                <el-radio-button :value="3">样式三</el-radio-button>
                <el-radio-button :value="4">样式四</el-radio-button>
                <el-radio-button :value="5">样式五</el-radio-button>
                <el-radio-button :value="6">样式六</el-radio-button>
                <el-radio-button :value="7">样式七</el-radio-button>
                <el-radio-button :value="8">样式八</el-radio-button>
            </el-radio-group>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">背景颜色</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-color-group" need-refresh="true">
                <div class="dec-color-button">
                    <a class="dec-color-reset" @click="frame.backgroundColor = defaultFrame.backgroundColor">重置</a>
                    <SelectColor v-model:color="frame.backgroundColor"></SelectColor>
                </div>
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">圆角</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="frame.boxRadius" show-input :show-input-controls="false" size="small" input-size="default" :max="30" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">内边距</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="frame.innerPadding" show-input :show-input-controls="false" size="small" input-size="default" :max="30" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">左右边距</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="frame.boxPadding" show-input :show-input-controls="false" size="small" input-size="default" :max="30" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">上边距</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="frame.boxPaddingTop" show-input :show-input-controls="false" size="small" input-size="default" :max="30" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">下边距</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="frame.boxPaddingBottom" show-input :show-input-controls="false" size="small" input-size="default" :max="30" />
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { SelectColor } from "@/components/select";
import CommonProductEdit from "../commonProduct/Edit.vue";
import { ref, onMounted, computed, ComputedRef } from "vue";
import { ModuleActivityType, ModuleType } from "@/types/decorate/decorate.d";
import { mergeDefaultModule, defaultFrame } from "@/views/decorate/decorate/src/modules/";
const frame = defineModel<ModuleActivityType & ModuleType>("modelValue", { default: () => ({}) });
const props = defineProps({
    type: {
        type: String,
        default: "",
    },
});
const selectLabel = ref<any>({
    style: {
        1: "一行一个",
        2: "一行两个",
        5: "详细列表",
        6: "横向滑动",
    },
    goodsStyle: {
        1: "标准",
        2: "投影",
        3: "描边",
        4: "透明底",
    },
    goodsRadioStyle: {
        1: "直角",
        2: "圆角",
    },
    waterfall: {
        1: "启用",
        0: "否",
    },
    textAlign: {
        1: "左对齐",
        2: "居中对齐",
    },
    textWeight: {
        1: "常规体",
        2: "加粗体",
    },
    goodsNameRow: {
        1: "1行",
        2: "2行",
    },
    goodsNamePadding: {
        1: "有边距",
        0: "无边距",
    },
    showName: {
        1: "显示",
        0: "不显示",
    },
    showBrief: {
        1: "显示",
        0: "不显示",
    },
    showPrice: {
        1: "显示",
        0: "不显示",
    },
    buyBtnStyle: {
        0: "不显示",
        1: "样式一",
        2: "显示",
        3: "显示",
        4: "显示",
        5: "显示",
        6: "显示",
        7: "显示",
        8: "显示",
    },
});
</script>
