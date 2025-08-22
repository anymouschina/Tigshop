<template>
    <a @click="delRecord" :class="{ disabled: disabled }">
        <slot></slot>
    </a>
</template>
<script setup lang="ts">
// 不使用a-switch，增加表格渲染速度
import { message, Modal } from "ant-design-vue";
const props = defineProps({
    requestApi: {
        type: Function,
        default: () => {}
    },
    params: {
        type: Object,
        default: {} as any
    },
    title: {
        type: String,
        default: "您确认要删除该数据吗？"
    },
    message: {
        type: String,
        default: "删除成功"
    },
    disabled: {
        type: Boolean,
        default: false
    }
});
const emit = defineEmits(["afterDelete"]);
//  删除项
const delRecord = () => {
    if (props.disabled) return;
    Modal.confirm({
        zIndex: 2009,
        title: props.title,
        okType: "danger",
        maskClosable: true,
        async onOk() {
            await props
                .requestApi(props.params)
                .then((result: any) => {
                    message.success(result && result !== 'success' ? result : props.message);
                    emit("afterDelete", true);
                })
                .catch((error: any) => {
                    message.error(error.message);
                });
        }
    });
};
</script>
<style scoped>
.disabled {
    cursor: not-allowed;
    color: rgb(199.5, 201, 204);
}
</style>
