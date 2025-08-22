<template>
    <div>
        <a-spin :spinning="loading">
            <el-button type="primary" class="mb20" @click="startAllTranslation" :disabled="isTranslating">全部翻译</el-button>
            <el-table :data="localesList" row-key="id" :loading="loading">
                <el-table-column label="语言" prop="language" width="180px">
                    <template #default="{ row }">
                        <div>{{ row.language || '--' }}</div>
                    </template>
                </el-table-column>
                <el-table-column label="翻译进度" prop="progress">
                    <template #default="{ row, $index }">
                        <div class="flex flex-align-center">
                            <div class="flex flex-align-center mr10" v-if="languageId == row.id && currentLanguageIndex === $index">
                                <a-spin size="small" class="mr10" />
                                <span v-if="isPaused">当前翻译完成后暂停...</span>
                                <span v-else>正在翻译中，请稍候... </span>
                            </div>
                            <div>
                                ({{ getProgress($index) }})
                            </div>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="90px">
                    <template #default="{ row, $index }">
                        <el-button 
                            v-if="isTranslating && (currentLanguageIndex === $index) && !isPaused" 
                            @click="pauseTranslation" 
                            type="primary" 
                            link>暂停翻译</el-button>
                        <el-button 
                            v-else-if="isPaused && (currentLanguageIndex === $index)" 
                            @click="resumeTranslation($index)" 
                            :disabled="!isTranslating"
                            type="primary" 
                            link>继续翻译</el-button>
                        <el-button 
                            v-else 
                            @click="translateLanguage($index)" 
                            :disabled="isTranslating" 
                            type="primary" 
                            link>单独翻译</el-button>
                    </template>
                </el-table-column>
                <template #empty>
                    <div class="empty-warp">
                        <div v-if="!loading" class="empty-bg">暂无数据</div>
                    </div>
                </template>
            </el-table>
        </a-spin>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";
import { message } from 'ant-design-vue';
import { getLocalesList } from "@/api/multilingual/languagesList";
import { unifiedTranslation } from "@/api/multilingual/translationContent";
import type { LocalesFilterState } from "@/types/multilingual/languagesList.d";
import { tr } from "element-plus/es/locale";

const emit = defineEmits(["submitCallback", "update:confirmLoading", "close", "closeConfirm"]);
const props = defineProps({
    dataType: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        default: 0
    },
    ids: {
        type: Array,
        default: []
    },
    visible:{
        type: Boolean,
        default: true
    }
});

const isTranslating = ref(false);
const isPaused = ref(false); // 是否暂停
const currentLanguageIndex = ref(0);
const totalTranslations = ref(props.total);
const batchSize = ref(20);
const progress = ref<any[]>([]);
const localesList = ref<LocalesFilterState[]>([]);
const loading = ref<boolean>(true);
const languageId = ref<any>(0);

const _getLocalesList = async () => {
    try {
        const result = await getLocalesList({
            isEnabled: 1,
            size: -1
        });
        result.records.forEach(item => {
            item.translationValue = "";
        });
        Object.assign(localesList.value, result.records);
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    _getLocalesList();
});
const translateType = ref<string>("");
    const newProgress = ref<number>(0);
// 开始全部翻译
const startAllTranslation = async () => {
    if (isTranslating.value) return; // 如果正在翻译中，直接返回
    translateType.value = "all";
    isTranslating.value = true;
    isPaused.value = false; // 重置暂停状态
    if(progress.value.length === 0) {
        progress.value = new Array(localesList.value.length).fill(0);
    }
    while (currentLanguageIndex.value < localesList.value.length) {
        if (isPaused.value) {
            break; // 如果处于暂停状态，则跳出循环
        }
        languageId.value = localesList.value[currentLanguageIndex.value].id;
        await translate(languageId.value, currentLanguageIndex.value);
        if (!isPaused.value) {
            currentLanguageIndex.value++;
            newProgress.value = 0; // 完成翻译时停止翻译状态
        }
    }
    if (!isPaused.value) {
        isTranslating.value = false; // 完成翻译时停止翻译状态
        emit("submitCallback", false);
    }
};

// 暂停翻译
const pauseTranslation = () => {
    isPaused.value = true; // 设置为暂停状态
};

// 单独翻译
const translateLanguage = async (languageIndex: number) => {
    translateType.value = "single";
    isTranslating.value = true;
    isPaused.value = false;
    currentLanguageIndex.value = languageIndex; // 未暂停
    languageId.value = localesList.value[languageIndex].id;
    await translate(languageId.value, languageIndex);
    isTranslating.value = false;
    if (!isPaused.value) {
        languageId.value = 0;
        newProgress.value = 0; // 完成翻译时停止翻译状态
    }
};
// 翻译逻辑
const translate = async (id: any, languageIndex: any) => {
    try {
        for (let start = newProgress.value; start < totalTranslations.value; start += batchSize.value) {
            if (isPaused.value) {
                currentLanguageIndex.value = languageIndex; // 记录暂停语言索引
                languageId.value = 0;
                return; // 如果处于暂停状态，返回不继续
            }
            const page = Math.floor(start / batchSize.value) + 1; // 计算当前页码
            const result = await unifiedTranslation({
                ids: props.ids,
                localesId: id,
                dataType: props.dataType,
                size: batchSize.value,
                page: page 
            });
            newProgress.value = Math.min(start + batchSize.value, totalTranslations.value);
            progress.value[languageIndex] = newProgress.value;
        }
    } catch (error: any) {
        message.error(error.message);
    } finally {
        emit("update:confirmLoading", false);
    }
};

// 继续翻译
const resumeTranslation = async (languageIndex: number) => {
    if (currentLanguageIndex.value === null) return; // 如果没有语言被暂停则返回
    isPaused.value = false; // 重置为不暂停
    isTranslating.value = false; // 标记为正在翻译
    if(translateType.value === "all"){
        startAllTranslation()
    }else{
        translateLanguage(languageIndex)
    }
};

// 获取进度
const getProgress = (index: any) => {
    const currentProgress = progress.value[index] || 0;
    return `${currentProgress}/${totalTranslations.value}`;
};

watch(() => isTranslating.value, (newValue) => {
    if (isTranslating.value == true) {
        emit("closeConfirm", true, "当前还有正在进行中的翻译，关闭之后会停止所有翻译操作，是否确认关闭？");
    }else{
        emit("closeConfirm", false);
    }
});
watch(() => props.visible, (newValue) => {
    if(props.visible == false){
        pauseTranslation()
    }
});

defineExpose({ pauseTranslation });
</script>

<style scoped>
table {
    width: 100%;
    border-collapse: collapse;
}
th,
td {
    border: 1px solid #ccc;
    padding: 8px;
    text-align: left;
}
button {
    padding: 5px 10px;
    margin-top: 10px;
}
</style>
