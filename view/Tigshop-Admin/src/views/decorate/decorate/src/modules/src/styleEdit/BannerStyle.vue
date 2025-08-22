<template>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">搜索框/导航效果</div>
            <div class="value">{{ selectLabel.effectType[bannerStyle.effectType as EffectType] }}</div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="bannerStyle.effectType">
                <el-tooltip effect="light" placement="bottom" content="正常模式" :show-after="100">
                    <el-radio-button :value="'default'"><i class="iconfont-admin icon-default"></i></el-radio-button>
                </el-tooltip>
                <el-tooltip effect="light" placement="bottom" content="滚动至顶部固定" :show-after="100">
                    <el-radio-button :value="'ceiling'"><i class="iconfont-admin icon-ceiling"></i></el-radio-button>
                </el-tooltip>
            </el-radio-group>
        </div>
    </div>
    <div class="dec-divider-line"></div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">背景颜色</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-color-group">
                <div class="dec-color-button">
                    <a class="dec-color-reset" @click="bannerStyle.searchBackgroundColor = ''">重置</a>
                    <SelectColor v-model:color="bannerStyle.searchBackgroundColor"></SelectColor>
                </div>
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">文本颜色</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-color-group">
                <div class="dec-color-button">
                    <a class="dec-color-reset" @click="bannerStyle.searchFontColor = ''">重置</a>
                    <SelectColor v-model:color="bannerStyle.searchFontColor"></SelectColor>
                </div>
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">按钮文本</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-input-group">
                <el-input v-model="bannerStyle.searchText" placeholder="请输入按钮文本"></el-input>
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">搜索框高度</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="bannerStyle.searchHeight" show-input :show-input-controls="false" size="small" input-size="default" :max="40" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">搜索框圆角</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="bannerStyle.searchRadius" show-input :show-input-controls="false" size="small" input-size="default" :max="20" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">图标尺寸</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="bannerStyle.searchIconSize" show-input :show-input-controls="false" size="small" input-size="default" :max="35" />
            </div>
        </div>
    </div>
    <div class="dec-divider-line"></div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">导航文字前缀</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-input-group">
                <el-input v-model="bannerStyle.navPrefix" placeholder="请输入导航文字前缀"></el-input>
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">导航文字颜色</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-color-group">
                <div class="dec-color-button">
                    <a class="dec-color-reset" @click="bannerStyle.navFontColor = ''">重置</a>
                    <SelectColor v-model:color="bannerStyle.navFontColor"></SelectColor>
                </div>
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">背景颜色</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-color-group">
                <div class="dec-color-button">
                    <a class="dec-color-reset" @click="bannerStyle.navBackgroundColor = ''">重置</a>
                    <SelectColor v-model:color="bannerStyle.navBackgroundColor"></SelectColor>
                </div>
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">文字前缀颜色</div>
            <div class="value"></div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-color-group">
                <div class="dec-color-button">
                    <a class="dec-color-reset" @click="bannerStyle.navPrefixColor = ''">重置</a>
                    <SelectColor v-model:color="bannerStyle.navPrefixColor"></SelectColor>
                </div>
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">导航文字对齐</div>
            <div class="value">{{ selectLabel.textAlignment[bannerStyle.textAlignment as TextAlignmentType] }}</div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="bannerStyle.textAlignment">
                <el-tooltip effect="light" placement="bottom" content="左对齐" :show-after="100">
                    <el-radio-button :value="'left'"><i class="iconfont-admin icon-alignLeft"></i></el-radio-button>
                </el-tooltip>
                <el-tooltip effect="light" placement="bottom" content="居中对齐" :show-after="100">
                    <el-radio-button :value="'center'"><i class="iconfont-admin icon-center"></i></el-radio-button>
                </el-tooltip>
                <el-tooltip effect="light" placement="bottom" content="右对齐" :show-after="100">
                    <el-radio-button :value="'right'"><i class="iconfont-admin icon-alignRight"></i></el-radio-button>
                </el-tooltip>
            </el-radio-group>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">导航文字粗细</div>
            <div class="value">{{ selectLabel.titleFontBold[bannerStyle.navFontBold as TitleFontBaold] }}</div>
        </div>
        <div class="dec-edit-group-con">
            <el-radio-group class="dec-radio-group" v-model="bannerStyle.navFontBold">
                <el-tooltip effect="light" placement="bottom" content="常规体" :show-after="100">
                    <el-radio-button :value="400"><i class="iconfont-admin icon-bianji-ziti" style="font-size: 14px;"></i></el-radio-button>
                </el-tooltip>
                <el-tooltip effect="light" placement="bottom" content="加粗体" :show-after="100">
                    <el-radio-button :value="700"><i class="iconfont-admin icon-bianji-ziti" style="font-size: 14px; font-weight: bold;"></i></el-radio-button>
                </el-tooltip>
            </el-radio-group>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">导航文字间距</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="bannerStyle.navLabelMargin" show-input :show-input-controls="false" size="small" input-size="default" :max="20" />
            </div>
        </div>
    </div>
    <div class="dec-edit-group">
        <div class="dec-edit-group-title">
            <div class="label">导航文字大小</div>
        </div>
        <div class="dec-edit-group-con">
            <div class="dec-range-group">
                <el-slider v-model="bannerStyle.navFontSize" show-input :show-input-controls="false" size="small" input-size="default" :max="20" />
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { SelectColor } from "@/components/select";
import { BannerStyleType, EffectType, TextAlignmentType, TitleFontBaold} from "@/types/decorate/decorate.d";
import { selectLabel } from "@/views/decorate/decorate/src/modules/editIndex";
const bannerStyle = defineModel<BannerStyleType>("modelValue", { default: () => ({}) });
</script>
