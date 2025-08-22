<template>
    <div @click="show" :class="'dialog-link ' + props.class" :style="'display:inline-flex;'">
        <slot></slot>
    </div>
    <MyModal
        v-if="loaded"
        :class="dialogClass"
        v-model:open="visible"
        :confirm-loading="confirmLoading"
        :width="_width"
        :title="_title"
        okText="确认"
        cancelText="取消"
        :destroyOnClose="true"
        @ok="onOk"
        :ok-button-props="{ disabled: okDisabled }"
        :footer-style="{ textAlign: 'right' }"
    >
        <a-config-provider :locale="zhCN">
            <Component
                ref="submitForm"
                @submitCallback="submitCallback"
                @show="show"
                @close="close"
                @okType="okType"
                v-bind="params"
                v-model:confirmLoading="confirmLoading"
            >
            </Component>
        </a-config-provider>
        <template #footer>
            <a-button style="margin-right: 12px" @click="close">取消</a-button>
            <a-button :disabled="okDisabled" :loading="confirmLoading" type="primary" @click="onOk">确认</a-button>
        </template>
    </MyModal>
</template>
<script setup lang="ts">
import { ref, defineAsyncComponent, shallowRef, computed } from "vue";
import zhCN from "ant-design-vue/es/locale/zh_CN";

import { Drawer, Modal } from "ant-design-vue";
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
    isDrawer: {
        type: Boolean,
        default: false
    },
    data: {
        //额外传参，添加相册返回的同时会回传
        type: Object,
        default: {}
    },
    type: String //类型  空:普通表单   gallery:相册
});
const emit = defineEmits([
    "okCallback" //确认后回调
]);
const MyModal = props.isDrawer == true ? Drawer : Modal;
const Component = shallowRef();
const visible = ref<boolean>(false);
const confirmLoading = ref<boolean>(false);
const okDisabled = ref<boolean>(false);
const dialogClass = ref(props.dialogClass);
const _title = ref(props.title);
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
// 相册弹窗
if (props.type == "gallery") {
    dialogClass.value += " " + "lyecs-modal-gallery noPadding";
    _path = "gallery/Gallery";
    _title.value = "相册";
}

function show(e: any) {
    if (loaded.value == false) {
        loadComponent();
    }
    loaded.value = true;
    visible.value = true;
}
function close(e: any) {
    visible.value = false;
}
const submitForm = ref();

async function loadComponent() {
    return new Promise((resolve, reject) => {
        // 加载多级目录，其中**代表多级
        const components = import.meta.glob("../../../views/**/*.vue");
        // 异步加载动态组件
        Component.value = defineAsyncComponent((components as any)["../../../views/" + _path + ".vue"]);
    });
}

const submitCallback = (result: any) => {
    // 如果返回结果无报错，关闭弹窗
    visible.value = false;
    confirmLoading.value = false;
    // 执行父组件传来的确认回调，如刷新列表
    emit("okCallback", result, props.data);
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
    close
});
</script>
