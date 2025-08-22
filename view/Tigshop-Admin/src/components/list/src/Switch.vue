<template>
    <div @click="switchChange" :class="'table-switch table-switch-' + (selectChecked ? 'on' : 'off')">
        <i></i>
    </div>
</template>
<script setup lang="ts">
// 不使用a-switch，增加表格渲染速度
import { computed, toRefs } from "vue";
import request from '@/utils/request'
import { message } from 'ant-design-vue'
const props = defineProps({
    requestApi: {
        type: Function,
        default: request
    },
    params: {
        type: Object,
        default: {} as any
    },
    checked: { type: [Boolean, Number], default: Number },
    switchingCode:{
        type: Array,
        default: [0,1]
    }
})
const selectChecked = computed(() => {
    return checked.value==props.switchingCode[1] ? 1:0
})
const emit = defineEmits(['update:checked', 'callback',"updateData"])
const { checked } = toRefs(props)
const switchChange = () => {
    props.requestApi({ ...props.params, val: checked.value==props.switchingCode[1] ? props.switchingCode[0] : props.switchingCode[1] })
        .then((result: any) => {
            emit('update:checked', checked.value==props.switchingCode[1] ? props.switchingCode[0] : props.switchingCode[1])
            emit('callback')
            emit('updateData')
            message.success('操作成功')
        }).catch((error:any) => {
            message.error(error.message)
        });
}
</script>
