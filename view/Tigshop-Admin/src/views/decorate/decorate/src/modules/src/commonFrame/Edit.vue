<template>
    <!-- 结构设置 -->
    <div class="dec-divider-line" v-if="type != 'live'"></div>

    <div class="dec-spread-title" v-if="type != 'notice' && type != 'searchBar' && type != 'live'">
        <div class="title">模块设置</div>
    </div>
    <div class="dec-edit-group" v-if="type == 'notice' || type == 'searchBar'">
        <div class="dec-edit-group-title">
            <div class="label">文字颜色</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-color-group" need-refresh="true">
                <div class="dec-color-button">
                    <a class="dec-color-reset" @click="frame.textColor = defaultFrame.textColor">重置</a>
                    <SelectColor v-model:color="frame.textColor"></SelectColor>
                </div>
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type == 'notice' || type == 'searchBar'">
        <div class="dec-edit-group-title">
            <div class="label">组件背景</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-color-group" need-refresh="true">
                <div class="dec-color-button">
                    <a class="dec-color-reset" @click="frame.itemBackgroundColor = defaultFrame.itemBackgroundColor">重置</a>
                    <SelectColor v-model:color="frame.itemBackgroundColor"></SelectColor>
                </div>
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type == 'notice' || type == 'searchBar'">
        <div class="dec-edit-group-title">
            <div class="label">组件圆角</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="frame.itemRadius" show-input :show-input-controls="false" size="small" input-size="default" :max="50" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type == 'notice' || type == 'searchBar'">
        <div class="dec-edit-group-title">
            <div class="label">组件高度</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="frame.itemHeight" show-input :show-input-controls="false" size="small" input-size="default" :max="50" />
            </div>
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
    <div class="dec-edit-group" v-if="type != 'line' && type != 'notice' && type != 'searchBar'">
        <div class="dec-edit-group-title">
            <div class="label">圆角</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="frame.boxRadius" show-input :show-input-controls="false" size="small" input-size="default" :max="30" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group"  v-if="type != 'line' && type != 'notice' && type != 'searchBar'">
        <div class="dec-edit-group-title">
            <div class="label">内边距</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="frame.innerPadding" show-input :show-input-controls="false" size="small" input-size="default" :max="30" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type == 'titleAd'">
        <div class="dec-edit-group-title">
            <div class="label">左右内边距</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="frame.leftAndRightPadding" show-input :show-input-controls="false" size="small" input-size="default" :max="30" />
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
import { ModuleFrameType } from "@/types/decorate/decorate.d";
import { mergeDefaultModule, defaultFrame } from "@/views/decorate/decorate/src/modules/";
const frame = defineModel<ModuleFrameType>("modelValue", { default: () => ({}) });
// 传值
const props = defineProps({
    type: {
        type: String,
        default: ''
    }
})
</script>
