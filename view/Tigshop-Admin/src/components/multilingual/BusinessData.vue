<template>
    <div style="width: 100%" v-if="type == 'input'">
        <TigInput
            classType="tig-form-input"
            v-model="modelValue"
            :disabled="disabled"
            :placeholder="placeholder"
            :width="width"
            :maxlength="maxlength"
            :suffix-icon="suffixIcon"
            @blur="emit('blur')"
        >
            <template #append v-if="isOverseas()">
                <DialogForm
                    isDrawer
                    @okCallback="_getCreateTranslation"
                    :title="'内容翻译'"
                    width="800px"
                    path="setting/multilingual/translationContent/BusinessDialog"
                    :params="{ act: isTranslation ? 'add' : 'detail', id: dataId, dataType: dataType, translationName: modelValue }"
                >
                    <el-button>
                        <SvgIcon v-if="!isTranslation" name="multilingual-multilingual" width="18" height="18" />
                        <SvgIcon v-else name="multilingual-multilingual-a" width="18" height="18" />
                    </el-button>
                </DialogForm>
            </template>
        </TigInput>
    </div>
    <div class="flex flex-align-center" style="width: 100%" v-if="type == 'select'">
        <el-select
            class="input-tag-warp"
            style="width: 390px !important"
            :teleported="false"
            v-model="tagValue"
            multiple
            filterable
            allow-create
            default-first-option
            :reserve-keyword="false"
            placeholder=""
            popper-class="input-tag-popper-warp"
            @change="onChange"
            :filter-method="onfilter"
            @keyup.enter="onEnter"
        >
        </el-select>
        <DialogForm
            v-if="isOverseas()"
            isDrawer
            @okCallback="_getCreateTranslation"
            :title="'内容翻译'"
            width="800px"
            path="setting/multilingual/translationContent/BusinessDialog"
            :params="{ act: isTranslation ? 'add' : 'detail', id: dataId, dataType: dataType, translationName: modelValue }"
        >
            <el-button style="margin-left: 10px">
                <SvgIcon v-if="!isTranslation" name="multilingual-multilingual" width="18" height="18" />
                <SvgIcon v-else name="multilingual-multilingual-a" width="18" height="18" />
            </el-button>
        </DialogForm>
    </div>
    <div class="multilingual-box" v-if="type == 'text'">
        <div class="multilingual-text">
            {{ modelValue }}
        </div>
        <div v-if="isOverseas()" class="multilingual-icon" style="margin-left: 10px">
            <DialogForm
                v-if="isOverseas()"
                isDrawer
                @okCallback="_getCreateTranslation"
                :title="'内容翻译'"
                width="800px"
                path="setting/multilingual/translationContent/BusinessDialog"
                :params="{ act: isTranslation ? 'add' : 'detail', id: dataId, dataType: dataType, translationName: modelValue }"
            >
                <SvgIcon v-if="!isTranslation" name="multilingual-multilingual" width="18" height="18" />
                <SvgIcon v-else name="multilingual-multilingual-a" width="18" height="18" />
            </DialogForm>
        </div>
    </div>
    <div class="multilingual-editor-box" v-if="type == 'editor'">
        <div v-if="isOverseas()" class="multilingual-editor-icon">
            <DialogForm
                v-if="isOverseas()"
                isDrawer
                @okCallback="_getCreateTranslation"
                :title="'内容翻译'"
                width="800px"
                path="setting/multilingual/translationContent/BusinessEditorDialog"
                :params="{ act: isTranslation ? 'add' : 'detail', id: dataId, dataType: dataType, translationName: modelValue }"
            >
                <el-button>
                    <SvgIcon v-if="!isTranslation" name="multilingual-multilingual" width="18" height="18" />
                    <SvgIcon v-else name="multilingual-multilingual-a" width="18" height="18" />
                    <span style="margin-left: 5px;">富文本翻译</span>
                </el-button>
            </DialogForm>
        </div>
    </div>
    <div class="multilingual-textarea-box ml10" v-if="type == 'textarea'">
        <div v-if="isOverseas()" class="multilingual-textarea-icon">
            <DialogForm
                v-if="isOverseas()"
                isDrawer
                @okCallback="_getCreateTranslation"
                :title="'内容翻译'"
                width="800px"
                path="setting/multilingual/translationContent/BusinessDialog"
                :params="{ act: isTranslation ? 'add' : 'detail', id: dataId, dataType: dataType, translationName: modelValue }"
            >
                <el-button>
                    <SvgIcon v-if="!isTranslation" name="multilingual-multilingual" width="18" height="18" />
                    <SvgIcon v-else name="multilingual-multilingual-a" width="18" height="18" />
                    <span style="margin-left: 5px;">多语言</span>
                </el-button>
            </DialogForm>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { DialogForm } from "@/components/dialog";
import { ref, defineModel, onMounted, watch, PropType, VNode } from "vue";
import { message } from "ant-design-vue";
import { getCreateTranslation, updateCreateTranslation } from "@/api/multilingual/currencyManagement";
import { isOverseas } from "@/utils/version";

const props = defineProps({
    disabled: {
        type: Boolean,
        default: false
    },
    placeholder: {
        type: String,
        default: ""
    },
    dataType: {
        type: Number,
        default: 2
    },
    dataId: {
        type: Number,
        default: 0
    },
    maxlength: {
        type: Number,
        default: 999999
    },
    type: {
        type: String,
        default: "input"
    },
    splitString: {
        type: String,
        value: ","
    },
    width: {
        type: String,
        default: "100%"
    },
    suffixIcon: {
        type: [String, Function, null, Object] as PropType<string | (() => VNode) | any>,
        default: null
    }
});
const emit = defineEmits(["update:modelValue", "blur"]);
const modelValue = defineModel<string>("modelValue", { type: String, default: "" });
const translationName = ref<string>("");
const isTranslation = ref(false);
const _getCreateTranslation = async () => {
    try {
        const result = await getCreateTranslation({
            dataType: props.dataType,
            dataId: props.dataId,
            translationName: modelValue.value
        });
        if (result.items.length <= 0) {
            isTranslation.value = true;
        } else {
            translationName.value = result.translationName;
            isTranslation.value = false;
        }
    } catch (error: any) {
        message.error(error.message);
    }
};
// 监听modelValue变化
watch(modelValue, (newVal: string) => {
    if (newVal != translationName.value) {
        isTranslation.value = true;
    } else {
        isTranslation.value = false;
    }
});
const tagValue = ref();
const splitString = ref();
splitString.value = props.splitString || ",";
if (props.type == "select") {
    if (typeof modelValue.value === "string") {
        tagValue.value = modelValue.value ? modelValue.value.split(splitString.value) : [];
    } else {
        tagValue.value = modelValue.value;
    }
}
const onChange = (value: any) => {
    if (typeof modelValue.value === "string") {
        emit("update:modelValue", tagValue.value.join(splitString.value));
    } else {
        emit("update:modelValue", tagValue.value);
    }
};
const filterInput = ref();
const onfilter = (e: any) => {
    if (e) filterInput.value = e;
};
const onEnter = () => {
    if (tagValue.value.indexOf(filterInput.value) === -1) {
        if (filterInput.value) {
            tagValue.value.push(filterInput.value);
            filterInput.value = "";
        }
    }
};
onMounted(() => {
    if ((props.dataId > 0 || props.dataType > 7) && (modelValue.value !== '' && modelValue.value !== "<p><br></p>")) {
        _getCreateTranslation();
    }
});
</script>

<style lang="less" scoped>
:deep(.el-button) {
    padding: 3px 15px;
}
.multilingual-box {
    position: relative;
    width: 100%;
    .multilingual-text {
        width: 100%;
        white-space: nowrap; /* 防止文字换行 */
        overflow: hidden; /* 隐藏溢出的文字 */
        text-overflow: ellipsis; /* 显示省略号来代替溢出的文字 */
    }
    .multilingual-icon {
        position: absolute;
        top: -8px;
        right: -8px;
        z-index: 100;
    }
}
.multilingual-editor-box{
    position: relative;
    width: 100%;
    .multilingual-editor-icon{
        position: absolute;
        z-index: 10;
        right: 10px;
        bottom: 40px;
    }
}
</style>
