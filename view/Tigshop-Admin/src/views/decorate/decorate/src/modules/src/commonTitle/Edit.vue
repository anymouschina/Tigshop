<template>
    <!-- 标题设置 -->
    <div class="dec-divider-line" v-if="type != 'title'"></div>

    <div class="dec-spread-title" v-if="type == 'categoryNavA3'">
        <div class="title">顶部标题设置</div>
    </div>

    <div class="dec-spread-title" v-else>
        <div class="title">标题设置</div>
    </div>

    <div class="dec-edit-group" v-if="type != 'title'">
        <div class="dec-edit-group-title">
            <div class="label">显示标题栏</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-radio-group">
                <el-radio-group class="dec-radio-group" v-model="title.showTitle">
                    <el-radio-button :value="1">显示</el-radio-button>
                    <el-radio-button :value="0">不显示</el-radio-button>
                </el-radio-group>
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">标题栏风格</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="title.titleStyle">
                <el-radio-button :label="1">风格一</el-radio-button>
                <el-radio-button :label="2">风格二</el-radio-button>
                <el-radio-button :label="3" v-if="type == 'product'">风格三</el-radio-button>
            </el-radio-group>
        </div>
    </div>
    <div class="dec-edit-group"  v-if="type == 'title'">
        <div class="dec-edit-group-title">
            <div class="label">标题位置</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="title.titleAlign">
                <el-radio-button :label="1">居左</el-radio-button>
                <el-radio-button :label="2">居中</el-radio-button>
            </el-radio-group>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type != 'title'">
        <div class="dec-edit-group-title">
            <div class="label">标题背景色</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-color-group">
                <div class="dec-color-button">
                    <a class="dec-color-reset" @click="title.titleBackground = defaultTitle.titleBackground">重置</a>
                    <SelectColor v-model:color="title.titleBackground"></SelectColor>
                </div>
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type == 'product'">
        <div class="dec-edit-group-title">
            <div class="label">背景渐变色</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-color-group">
                <div class="dec-color-button">
                    <a class="dec-color-reset" @click="title.titleBackground2 = defaultTitle.titleBackground2">重置</a>
                    <SelectColor v-model:color="title.titleBackground2"></SelectColor>
                </div>
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type != 'title'">
        <div class="dec-edit-group-title">
            <div class="label">标题图片</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-pic-group dec-picSingle-group">
                <PicSelect v-model:photo="title.titleBackgroundPic" v-model:defaultValue="defaultTitle.titleBackgroundPic"></PicSelect>
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">标题圆角</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="title.titleRadius" show-input :show-input-controls="false" size="small" input-size="default" :max="30" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">标题内容</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-input-group">
                <el-input v-model="title.titleText" placeholder="请输入标题内容"></el-input>
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">标题颜色</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-color-group">
                <div class="dec-color-button">
                    <a class="dec-color-reset" @click="title.titleColor = defaultTitle.titleColor">重置</a>
                    <SelectColor v-model:color="title.titleColor"></SelectColor>
                </div>
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type != 'seckill2'">
        <div class="dec-edit-group-title">
            <div class="label">描述内容</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-input-group" dynamic-class=".image-ad-title-d">
                <el-input v-model="title.descText" placeholder="请输入标题内容"></el-input>
            </div>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type != 'seckill2'">
        <div class="dec-edit-group-title">
            <div class="label">描述颜色</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-color-group">
                <div class="dec-color-button">
                    <a class="dec-color-reset" @click="title.descColor = defaultTitle.descColor">重置</a>
                    <SelectColor v-model:color="title.descColor"></SelectColor>
                </div>
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">显示查看更多</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="title.showMore">
                <el-radio-button :value="1">显示</el-radio-button>
                <el-radio-button :value="0">不显示</el-radio-button>
            </el-radio-group>
        </div>
    </div>
    <div class="dec-edit-group" v-if="type != 'seckill2'">
        <div class="dec-edit-group-title">
            <div class="label">更多文字颜色</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-color-group">
                <div class="dec-color-button">
                    <a class="dec-color-reset" @click="title.moreColor = defaultTitle.moreColor">重置</a>
                    <SelectColor v-model:color="title.moreColor"></SelectColor>
                </div>
            </div>
        </div>
    </div>
    <div class="dec-edit-group ">
        <div class="dec-edit-group-title">
            <div class="label">更多链接</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-link-group">
                <div class="lyecs-link-select">
                    <SelectLink v-model="title.moreLink" :decorateType="decorateType"></SelectLink>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>

import { SelectColor } from '@/components/select'
import { PicSelect } from '@/components/decorate'
import { ref, onMounted, ComputedRef, computed } from 'vue';
import { SelectLink } from '@/components/select';
import { ModuleTitleType } from '@/types/decorate/decorate.d';
import { imageFormat } from "@/utils/format";
import { defaultTitle } from '@/views/decorate/decorate/src/modules/'
const title = defineModel<ModuleTitleType>('modelValue', {default: () => ({})});
const props = defineProps({
    type: {
        type: String,
        default: ''
    },
    decorateType: {
        type: String,
        default: ''
    }
})
</script>