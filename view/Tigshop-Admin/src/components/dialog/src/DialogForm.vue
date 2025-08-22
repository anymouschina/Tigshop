<template>
    <div @click.stop.shop="show" :class="'dialog-link ' + props.class" :style="props.style">
        <slot></slot>
    </div>
    <MyModal
        v-if="loaded"
        :class="dialogClass"
        v-model:open="visible"
        :confirm-loading="confirmLoading"
        :width="_width"
        :maskClosable="maskClosable"
        :title="showHeader ? (_type ? smTitle : title) : null"
        okText="确认"
        cancelText="取消"
        :destroyOnClose="true"
        @ok="onOk"
        :ok-button-props="{ disabled: okDisabled }"
        :footer-style="{ textAlign: 'right' }"
        v-bind="bindParams"
        :bodyStyle="bodyStyle"
        @close="close"
    >
        <a-config-provider :locale="zhCN">
            <Component
                ref="submitForm"
                :visible="visible"
                @submitCallback="submitCallback"
                @callback="callback"
                @show="show"
                @close="close"
                @okType="okType"
                @closeConfirm="onCloseConfirm"
                v-bind="params"
                v-model:confirmLoading="confirmLoading"
            >
            </Component>
        </a-config-provider>
        <template v-if="showClose || showOnOk" #footer>
            <el-button v-show="showClose" @click="close">取消</el-button>
            <el-button v-show="showOnOk" :disabled="okDisabled" :loading="confirmLoading" type="primary" @click="onOk">确认</el-button>
        </template>
    </MyModal>
</template>
<script setup lang="ts">
import { ref, defineAsyncComponent, shallowRef, computed, onMounted, watch, createVNode } from "vue";
import zhCN from "ant-design-vue/es/locale/zh_CN";
import { Drawer, Modal } from "ant-design-vue";
import { ExclamationCircleOutlined } from "@ant-design/icons-vue";
const loaded = ref(false);
const props = defineProps({
    path: String, //路径
    class: {
        //样式
        type: String,
        default: ""
    },
    dialogClass: {
        //
        type: String,
        default: ""
    },
    params: {
        //绑定给页面的参数
        type: Object,
        default: {}
    },
    width: {
        //绑定给页面的参数
        type: String,
        default: "800px"
    },
    title: {
        //绑定给页面的参数
        type: String,
        default: ""
    },
    smTitle: {
        //绑定给页面的参数
        type: String,
        default: ""
    },
    isDrawer: {
        type: Boolean,
        default: false
    },
    showClose: {
        type: Boolean,
        default: true
    },
    showOnOk: {
        type: Boolean,
        default: true
    },
    showFooter: {
        type: Boolean,
        default: true
    },
    maskClose: {
        type: Boolean,
        default: true
    },
    data: {
        //额外传参，添加相册返回的同时会回传
        type: Object,
        default: {}
    },
    bodyStyle: {
        type: Object,
        default: {}
    },
    style: {
        //绑定给页面的参数
        type: [String, Object],
        default: "display:inline-flex;"
    },
    showHeader: {
        // 新的 prop，用于控制是否显示头部
        type: Boolean,
        default: true
    },
    maskClosable: {
        // 点击蒙层是否允许关闭
        type: Boolean,
        default: true
    },
    disabled: {
        type: Boolean,
        default: false
    },
    type: String //类型  空:普通表单   gallery:相册
});
const emit = defineEmits([
    "okCallback", //确认后回调
    "callback",
    "closeCallback"
]);
const MyModal = props.isDrawer == true ? Drawer : Modal;
const Component = shallowRef();
const visible = ref<boolean>(false);
const confirmLoading = ref<boolean>(false);
const okDisabled = ref<boolean>(false);
const closeConfirm = ref<boolean>(false);
const closeConfirmText = ref<string>("退出后，当前修改的内容不会被保存");
const dialogClass = ref(props.dialogClass);

const bindParams = ref<{ footer?: string }>({});
if (props.showFooter === false) {
    bindParams.value.footer = "";
}
let _path = props.path;
// params参数是可变的（比如相册里的添加子相册按钮），这里需要做监听
const params = computed(() => {
    return Object.assign(props.params, { isDialog: true });
});
const _width = computed(() => {
    if (props.type == "gallery") {
        return "811px";
    } else {
        return props.width;
    }
});
const _type = ref(false);
const smTitle = ref("");
// 相册弹窗
if (props.type == "gallery") {
    dialogClass.value += " " + "lyecs-modal-gallery noPadding";
    _path = "gallery/Gallery";
    _type.value = true;
    smTitle.value = "图片相册";
}
// 视频相册弹窗
if (props.type == "galleryVideo") {
    dialogClass.value += " " + "lyecs-modal-gallery noPadding";
    _path = "gallery/video/GalleryVideo";
    _type.value = true;
    smTitle.value = "视频相册";
}

const show = (e: any) => {
    if (props.disabled) return;
    if (loaded.value == false) {
        loadComponent();
    }
    confirmLoading.value = false;
    loaded.value = true;
    visible.value = true;
};
const close = (e: any) => {
    if (closeConfirm.value == true) {
        visible.value = true;
        Modal.confirm({
            title: "退出当前编辑？",
            icon: createVNode(ExclamationCircleOutlined),
            content: createVNode("div", { style: "color:red;" }, closeConfirmText.value),
            onOk() {
                visible.value = false;
                closeConfirm.value = false;
            },
            onCancel() {
                console.log("Cancel");
            }
        });
        return;
    }
    visible.value = false;
};
const onCloseConfirm = (value: boolean, text?: string) => {
    closeConfirm.value = value;
    if (text) {
        closeConfirmText.value = text;
    }
};
watch(
    () => visible.value,
    (val) => {
        if (!val) {
            emit("closeCallback");
        }
    }
);
const submitForm = ref();

async function loadComponent() {
    return new Promise((resolve, reject) => {
        // 加载多级目录，其中**代表多级
        const components = import.meta.glob("../../../views/**/*.vue");
        // 异步加载动态组件
        Component.value = defineAsyncComponent((components as any)["../../../views/" + _path + ".vue"]);
    });
}

onMounted(() => {});

const submitCallback = (result: any) => {
    // 如果返回结果无报错，关闭弹窗
    visible.value = false;
    confirmLoading.value = false;
    // 执行父组件传来的确认回调，如刷新列表
    emit("okCallback", result, props.data);
};
const callback = (result: any) => {
    emit("callback", result, props.data);
};
//
const onOk = () => {
    // 执行子组件的表单提交方法，方法名称固定为onFormSubmit
    submitForm.value.onFormSubmit();
};

const okType = (type: boolean) => {
    okDisabled.value = !type;
};

defineExpose({
    show,
    close,
    onCloseConfirm
});
</script>
