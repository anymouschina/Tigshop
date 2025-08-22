<template>
    <div @click="show" :class="'dialog-link ' + props.class" :style="'display:inline-flex;'">
        <slot></slot>
    </div>
    <MyModal :modal-class="dialogClass" v-if="loaded" append-to-body v-model="visible" :confirm-loading="confirmLoading" :size="_width" :width="_width" :title="_title"
        :destroy-on-close="true" @ok="onOk">
        <Component ref="submitForm" @submitCallback="submitCallback" @show="show" @close="close" @okType="okType" v-bind="params" v-model:confirmLoading="confirmLoading">
        </Component>
        <template #footer>
            <a-button style="margin-right: 12px" @click="close">取消</a-button>
            <a-button :disabled="okDisabled" :loading="confirmLoading" type="primary" @click="onOk">确认</a-button>
        </template>
    </MyModal>
</template>
<script setup lang="ts">
import { ref, defineAsyncComponent, shallowRef } from 'vue';
import { ElDrawer, ElDialog } from 'element-plus'
const loaded = ref(false)
const props = defineProps({
    path: String,//路径
    class: { //样式
        type: String,
        default: ''
    },
    dialogClass: { //
        type: String,
        default: ''
    },
    params: { //绑定给页面的参数
        type: Object,
        default: {}
    },
    width: { //绑定给页面的参数
        type: String,
        default: '800px'
    },
    title: { //绑定给页面的参数
        type: String,
        default: ''
    },
    isDrawer: {
        type: Boolean,
        default: false
    },
    type: String,//类型  空:普通表单   gallery:相册
})
const emit = defineEmits([
    "okCallback",   //确认后回调
])
const MyModal = props.isDrawer == true ? ElDrawer : ElDialog
const Component = shallowRef();
const _class = ref(props.class);
const visible = ref<boolean>(false);
const confirmLoading = ref<boolean>(false);
const okDisabled = ref<boolean>(false)
const dialogClass = ref(props.dialogClass)
const _width = ref(props.width)
const _title = ref(props.title)
let _path = props.path
const params = Object.assign(
    props.params,
    { isDialog: true }
);

// 相册弹窗
if (props.type == 'gallery') {
    dialogClass.value += ' ' + 'lyecs-modal-gallery noPadding'
    _width.value = '811px';
    _path = 'gallery/Gallery';
    _title.value = '相册';
}

function show(e:any) {
    if (loaded.value == false) {
        loadComponent()
    }
    loaded.value = true;
    visible.value = true;
}
function close(e:any) {
    visible.value = false;
}
const submitForm = ref();

async function loadComponent() {
    return new Promise((resolve, reject) => {
        // 加载多级目录，其中**代表多级
        const components = import.meta.glob("../../../views/**/*.vue");
        // 异步加载动态组件
        Component.value = defineAsyncComponent((components as any)['../../../views/' + _path + '.vue'])
    });
}


const submitCallback = (result: any) => {
    if (!result.code) {
        // 如果返回结果无报错，关闭弹窗
        visible.value = false;
        confirmLoading.value = false;
        // 执行父组件传来的确认回调，如刷新列表
        emit('okCallback', result)
    }
}
// 
const onOk = () => {
    // 执行子组件的表单提交方法，方法名称固定为onFormSubmit
    submitForm.value.onFormSubmit()
};

const okType = (type: boolean) => {
    okDisabled.value = !type
};


</script>
