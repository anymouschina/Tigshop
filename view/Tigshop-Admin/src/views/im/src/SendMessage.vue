<template>
    <div class="im-edit-box comment-editor">
        <div class="im-edit-box-toolbar">
            <div class="zent-tooltip-wrapper">
                <div class="toolbar-pop-m_wrap" @click="setRangeLast">
                    <el-popover ref="popoverRef" trigger="click" width="438px" :teleported="false" :hide-after="0" placement="top-start" :offset="15">
                        <Emoji @insertEmoji="onInsertEmoji" />
                        <template #reference>
                            <div class="emoji-container emoji-btn imicon imicon-emoji">
                                <div class="emoji-box" ref="emojiRef">
                                    <SvgIcon name="im-face" height="20" width="20"></SvgIcon>
                                </div>
                            </div>
                        </template>
                    </el-popover>
                </div>
                <div class="toolbar-pop-m_wrap">
                    <Upload
                        name="file"
                        :action="requestUrl.prefix + '/setting/galleryPic/uploadImg'"
                        :headers="requestUrl.headers() as any"
                        @change="handleChange"
                        :showUploadList="false"
                        :before-upload="beforeUpload"
                        :multiple="false"
                    >
                        <div class="image-btn">
                            <SvgIcon name="im-pic" height="20" width="20"></SvgIcon>
                        </div>
                    </Upload>
                </div>
            </div>
        </div>
        <div class="comment-input default">
            <div class="input-box" v-click-outside="onClickOutside">
                <textarea
                    ref="editorRef"
                    @focus="onFocus"
                    @keydown="handleKeydown"
                    spellcheck="false"
                    placeholder="提示：按Enter键发送，Shift+Enter换行"
                    class="rich-input"
                    :class="{ empty: editableContent.length == 0 }"
                    v-model="editableContent"
                ></textarea>
                <div class="image-preview-box" v-if="picList.length > 0">
                    <div class="item" v-for="(item, index) in picList">
                        <div class="image-preview" :style="'background-image: url(' + imageFormat(item) + ');'"></div>
                        <div class="clean-btn" @click="removePic(index)">
                            <SvgIcon name="close" width="16" height="16" style="width: 16px; height: 16px" />
                        </div>
                    </div>
                </div>
                <!---->
                <div class="action-box" @click="setRangeLast">
                    <div style="flex: 1 1 0%"></div>
                    <div class="text-count-wrapper">
                        <div class="text-count" :class="{ 'text-count-error': textLength > 1000 }">
                            <span class="text text-count-real">{{ textLength }}&nbsp;</span>
                            <span class="text text-count-limit">/ 1000</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, unref, onMounted, onUnmounted, reactive, inject } from "vue";
import { requestUrl } from "@/utils/request";
import { Upload } from "ant-design-vue";
import { ClickOutside as vClickOutside } from "element-plus";
import { sendMessage } from "@/api/im/im";
import Emoji from "./Emoji.vue";
import { imageFormat } from "@/utils/format";
import { message } from "ant-design-vue";
import { computed } from "@vue/reactivity";
const receiveValueFromGrandChild: any = inject("receiveValueFromGrandChild");
const props = defineProps({
    messageInfo: {
        type: Object,
        default: {}
    }
});
const emit = defineEmits(["update:isEditComment", "successAdded", "sendMessage"]);
const emojiRef = ref();
const popoverRef = ref();
const picList = ref([]);
const editorRef = ref<HTMLDivElement | any>(null);
const editableContent = ref("");
const editableContentFocus = ref(false);
// 监听实时输入事件
function onInput(event: Event) {
    const target = event.target as HTMLDivElement;
}

const textLength = computed(() => {
    return editableContent.value.length;
});

let clearContentOnBlur = ref<boolean>(false);
// 如果需要在失去焦点时确保内容同步，可以使用此方法
function onBlur() {
    editableContent.value = editorRef.value?.innerHTML ?? "";
}
const onFocus = () => {
    editableContentFocus.value = true;
};
const onClickOutside = () => {
    editableContentFocus.value = false;
    emit("update:isEditComment", false);
};
const onInsertEmoji = (emoji: string) => {
    editorRef.value?.focus();
    editableContent.value += "[" + emoji + "]";
    setRangeLast();
};
const setRangeLast = () => {
    const lastChild = editorRef.value?.lastChild;
    if (lastChild) {
        const range2 = document.createRange();
        editorRef.value?.focus();
        // 设置光标位置到最后
        const range = document.createRange();
        const selection = window.getSelection();
        range2.setStartAfter(lastChild);
        range2.collapse(true);
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range2);
        }
    }
};
const beforeUpload = (file: any) => {
    const isLtSize = file.size / 1024 / 1024 < 10;
    if (!isLtSize) {
        message.error("只能上传10M以内的图片");
    }
    return isLtSize;
};
const handleChange = (info: any) => {
    if (info.file.status == "uploading") {
    }
    if (info.file.status !== "uploading") {
    }
    if (info.file.status === "done") {
        // 上传完成
        if (info.file.response.code !== 0) {
            info.file.status = "error";
            message.error(info.file.response.data.message);
        } else {
            for (let index in info.fileList) {
                if (info.file.uid == info.fileList[index].uid) {
                    info.fileList[index] = Object.assign(info.fileList[index], info.fileList[index].response.data);
                }
            }
            console.log(info.fileList[0].picUrl);
            info.fileList.map((item: any) => {
                onSendSubmit("image", item.picUrl);
            });
        }
    } else if (info.file.status === "error") {
        // message.error(`${info.file.name} 图片上传失败！`);
    }
};
const removePic = (index: number) => {
    picList.value.splice(index, 1);
};

const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
        if (event.shiftKey) {
            // 处理 Shift + Enter 的逻辑
            // console.log("Shift + Enter pressed");
        } else {
            // 处理 Enter 的逻辑
            // editableContent.value = editorRef.value?.innerHTML ?? "";
            onSendSubmit("text");

            // console.log("Enter pressed", editableContent.value);
            event.preventDefault(); // 阻止默认的换行行为
        }
    } else {
        // editableContent.value = editorRef.value?.innerHTML ?? "";
    }
};
const onSendSubmit = async (type: string = "", pic: string = "") => {
    if (editableContent.value == "" && type == "text") {
        message.error("请输入回复内容");
        return;
    }
    try {
        let info = {};
        Object.assign(info, props.messageInfo, {
            content: {
                messageType: type || "text",
                content: editableContent.value || "",
                pic: pic || ""
            }
        });
        const result = await sendMessage(info);
        emit("sendMessage", result);
        receiveValueFromGrandChild(result);
        editableContent.value = "";
    } catch (error: any) {
        console.log(error);
    } finally {
        editorRef.value.innerHTML = "";
    }
};

// 当编辑器挂载后开始监听内容变化
onMounted(() => {
    editorRef.value?.focus();
    if (editorRef.value) {
        // editorRef.value.addEventListener("keydown", handleKeydown);
    }
    // editableContent.value = editorRef.value?.innerHTML ?? "";
});
onUnmounted(() => {
    if (editorRef.value) {
        // editorRef.value.removeEventListener("keydown", handleKeydown);
    }
});
</script>
<style lang="less" scoped>
.im-edit-box {
    display: flex;
    flex: 0 0 150px;
    border-top: 1px solid #e5e5e5;
    flex-direction: column;
    position: relative;
    .im-edit-box-mask {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-color: hsla(0, 0%, 100%, 0.8);
        font-size: 14px;
        color: #999;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
        line-height: 24px;
    }
    .im-edit-box-toolbar {
        display: flex;
        align-items: center;
        padding: 0 5px;
        flex: 0 0 42px;
        .zent-tooltip-wrapper {
            display: flex;
        }
        .toolbar-pop-m_wrap {
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            .image-btn,
            .emoji-box {
                width: 38px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                fill: #646566;
                &:hover {
                    fill: #333;
                }
            }
            :where(.css-dev-only-do-not-override-174zhm8).ant-upload-wrapper {
                line-height: 0.6667;
            }
        }
    }
    .editor-m_wrap_QM07L {
        flex: 1 1 100%;
        display: flex;
        flex-direction: column;
        height: 80px;
        overflow: hidden;
        font-size: 14px;
        margin: 0 7px 7px;
    }
    .editor-wrap {
        flex: 1 1 100%;
        overflow-x: hidden;
        overflow-y: auto;
        position: relative;
        textarea {
            width: 100%;
            height: 100%;
            resize: none;
            border: 0;
            &:focus {
                border: none;
                outline: none;
            }
        }
    }
}

.comment-editor {
    font-style: normal;
    flex-shrink: 0;
    .comment-input .input-box {
        min-height: 88px;
        flex-shrink: 0;
        font-size: 0;
        transition: all 0.3s;
        background: var(--tig-gray-2);
        border: 1px solid transparent;
        border-radius: 4px;
        position: relative;
    }
    .comment-input .input-box {
        display: flex;
        flex-direction: column;
    }
    .comment-input .input-box .rich-input {
        position: relative;
        padding: 8px 12px;
        color: var(--tig-font-2);
        outline: none;
        box-sizing: border-box;
        line-height: 28px;
        height: 106px;
        font-size: 14px;
        overflow-y: auto;
        overflow-x: hidden;
        border-color: #fff;
    }
    .comment-input .input-box .rich-input.empty:before {
        content: attr(placeholder);
        position: absolute;
        pointer-events: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        color: #8a919f;
        font-size: 12px;
    }
    .comment-input .input-box.focused {
        min-height: 150px;
        max-height: 300px;
    }

    .comment-input .input-box .rich-input {
    }

    .hot-comment {
        margin-top: 0;
    }

    .title {
        color: var(--tig-font-1);
        font-size: 18px;
        font-weight: 600;
        line-height: 30px;
    }

    .comment-list-root {
        margin-top: 32px;
    }
}
.comment-form {
    .content {
        display: flex;
        align-items: flex-start;
    }
    .content .form-box {
        flex: 1;
    }

    .avatar-box {
        flex: 0 0 auto;
    }

    .avatar {
        margin-right: 16px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        img {
            border-radius: 50%;
            width: 100%;
            height: 100%;
            -o-object-fit: cover;
            object-fit: cover;
            background-color: var(--tig-gray-3);
        }
    }
}

.comment-input .input-box .action-box {
    flex-shrink: 0;
}
.comment-input .input-box .action-box {
    padding: 0 2px 0 6px;
    display: flex;
    align-items: center;
}
.emoji-container {
    position: relative;
}
.emoji-container .emoji-box {
    display: flex;
    align-items: center;
    position: relative;
    cursor: pointer;
}

.input-box .action-box .emoji-btn .emoji-box {
    width: 20px;
    height: 20px;
    padding: 6px;
}
.comment-input .input-box .action-box .emoji-btn .emoji-box .icon {
    fill: var(--tig-font-3);
    margin: 0;
    width: 20px;
    height: 20px;
    transition: fill 0.3s;
}
.comment-input .input-box .action-box .image-btn {
    cursor: pointer;
    margin-left: 12px;
    padding: 6px;
}
.comment-input .input-box .action-box .image-btn .icon {
    fill: var(--tig-font-3);
    background-repeat: no-repeat;
    background-size: cover;
    margin: 0;
    transition: fill 0.3s;
    width: 20px;
    height: 20px;
    display: block;
}
.comment-input .input-box .action-box .emoji-btn .emoji-box.active .icon,
.comment-input .input-box .action-box .emoji-btn .emoji-box:hover .icon {
    fill: var(--tig-brand-1-normal);
}
.comment-input .input-box .action-box .image-btn.active .icon,
.comment-input .input-box .action-box .image-btn:hover .icon {
    fill: var(--tig-brand-1-normal);
}

.comment-input .input-box .action-box .text-count-wrapper {
    display: flex;
    align-items: center;
    color: var(--tig-font-3);
    font-size: 16px;
    align-items: center;
    .count-info {
        display: flex;
        align-items: center;
    }
}
.comment-input .input-box .action-box .text-count-wrapper .text-count {
    font-size: 14px;
    font-weight: 400;
    line-height: 28px;
    margin-right: 8px;
}
.comment-input .input-box .action-box .text-count-wrapper .text-count .text-count-real {
    color: var(--tig-font-2);
}
.comment-input .input-box .action-box .text-count-wrapper .text-count.text-count-error .text {
    color: #f56c6c;
}
.comment-input .input-box .rich-input :deep(.emoji) {
    vertical-align: sub;
    cursor: default;
    height: 20px;
    margin: 0 2px;
}
.comment-input .input-box.focused {
    min-height: 150px;
    max-height: 300px;
    border-color: var(--tig-brand-1-normal);
    background: #fff;
}

.image-preview-box {
    display: inline-block;
    position: relative;
    margin-left: 12px;
    align-self: flex-start;
    display: flex;
    .item {
        margin-right: 10px;
        position: relative;
    }
    .image-preview {
        width: 64px;
        height: 64px;
        background-position: 50%;
        background-repeat: no-repeat;
        background-size: cover;
        border-radius: 4px;
        border: 1px solid var(--tig-gray-1-2);
    }
    .clean-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        cursor: pointer;
        opacity: 0.8;
        transition: all 0.2s;
    }
}
</style>
