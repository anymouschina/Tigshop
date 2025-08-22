<template>
    <div class="container">
        <div class="content_wrapper">
            <div class="lyecs-form-table">
                <el-form v-if="!loading" ref="formRef" :model="formState" label-width="auto">
                    <el-form-item :rules="[{ required: true, message: '属性模板名称不能为空!' }]" label="属性模板名称" prop="tplName">
                        <BusinessData v-model:modelValue="formState.tplName" width="350px" :dataType="8"></BusinessData>
                        <!-- <TigInput classType="tig-form-input" v-model="formState.tplName"/> -->
                    </el-form-item>
                    <el-form-item label="属性名称" prop="brandLogo">
                        <div class="attr-warp-box">
                            <el-space v-for="(attr, index) in formState?.tplData?.normal" class="attr-row">
                                <BusinessData v-model:modelValue="attr['attrName']" width="260px" :dataType="8"></BusinessData>
                                <!-- <TigInput v-model="attr['attrName']" placeholder="" width="260px"/> -->
                                <div class="iconfont icon-cha1 btn-remove" @click="removeAttr('normal',  Number(index))"></div>
                            </el-space>
                            <el-space class="attr-row">
                                <el-button @click="addAttr('normal')"><i class="btn-ico">+</i>增加新属性</el-button>
                            </el-space>
                        </div>
                    </el-form-item>
                    <el-form-item label="规格名称">
                        <div class="attr-warp-box">
                            <el-space v-for="(attr, index) in formState?.tplData?.spe" class="attr-row">
                                <!-- <TigInput v-model="attr['attrName']" placeholder="" width="260px"/> -->
                                <BusinessData v-model:modelValue="attr['attrName']" width="260px" :dataType="8"></BusinessData>
                                <div class="iconfont icon-cha1 btn-remove" @click="removeAttr('spe',  Number(index))"></div>
                            </el-space>
                            <el-space class="attr-row">
                                <el-button @click="addAttr('spe')"><i class="btn-ico">+</i>增加新规格</el-button>
                            </el-space>
                        </div>
                    </el-form-item>
                    <el-form-item label="附加规格">
                        <div class="attr-warp-box">
                            <el-space v-for="(attr, index) in formState?.tplData?.extra" class="attr-row">
                                <!-- <TigInput v-model="attr['attrName']" placeholder="" width="260px"/> -->
                                <BusinessData v-model:modelValue="attr['attrName']" width="260px" :dataType="8"></BusinessData>
                                <div class="iconfont icon-cha1 btn-remove" @click="removeAttr('extra', Number(index))"></div>
                            </el-space>
                            <el-space class="attr-row">
                                <el-button @click="addAttr('extra')"><i class="btn-ico">+</i>增加附加规格</el-button>
                            </el-space>
                        </div>
                    </el-form-item>
                    <el-form-item v-show="!isDialog" :wrapper-col="{ offset: 4, span: 16 }">
                        <el-button ref="submitBtn" class="form-submit-btn" type="primary" @click="onSubmit()">提交
                        </el-button>
                    </el-form-item>
                </el-form>
                <a-spin :spinning="loading" style="width:100%;margin-top:100px"/>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import BusinessData from "@/components/multilingual/BusinessData.vue";
import {onMounted, ref, shallowRef} from "vue"
import {useRouter} from 'vue-router'
import {message} from "ant-design-vue";
import {ProductAttributesTplFormState} from "@/types/product/productAttributesTpl";
import {getProductAttributesTpl, updateProductAttributesTpl} from "@/api/product/productAttributesTpl";
// 父组件回调
const emit = defineEmits([
    "submitCallback",   //确认后回调
    "update:confirmLoading",    //确认按钮的loading状态
    "close"  //关闭弹窗
])
//获取来自父组件的参数
const props = defineProps({
    id: {
        type: Number,
        default: 0
    },
    act: {
        type: String,
        default: ''
    },
    isDialog: Boolean
});

const loading = ref<boolean>(true);
const query = useRouter().currentRoute.value.query;
const action = ref<string>(props.isDialog ? props.act : String(query.act));
const id = ref<number>(props.isDialog ? props.id : Number(query.id));
const operation = action.value === 'add' ? 'create' : 'update';
const formRef = shallowRef();
const formState = ref<ProductAttributesTplFormState>({

});

onMounted(() => {
    if (action.value === "detail") {
        // 获取详情数据
        fetchTpl();
    } else {
        loading.value = false;
    }
});
const fetchTpl = async () => {
    try {
        const result: any = await getProductAttributesTpl(action.value, {id: id.value});
        // let temp:FilterState = result;
        // temp.tplData = temp.tplData?JSON.parse(temp.tplData):{}
        Object.assign(
          formState.value,
          result
        )
    } catch (error:any) {
        message.error(error.message);
        emit('close');
    } finally {
        loading.value = false;
    }
};

// 移除属性项
const removeAttr = (type: string, index: number) => {
    (formState.value as any).tplData[type].splice(index, 1);
}

// 新增类型
const addAttr = (type: string) => {
    // 首先确保 tplData 存在
    if (formState.value.tplData) {
        // 然后检查 tplData 中对应 type 的值是否为数组，如果不是或不存在，则赋值为空数组
        if (!Array.isArray((formState.value as any).tplData[type])) {
            (formState.value as any).tplData[type] = [];
        }
    }else{
        let obj:any = {}
        obj[type] = [];
        (formState.value as any).tplData = obj
    }

    (formState.value as any).tplData[type].push({
        attrName: ''
    })
}


// 表单通过验证后提交
const onSubmit = async () => {
    await formRef.value.validate();
    try {
        console.log(formState.value);
        emit('update:confirmLoading', true);
        const result = await updateProductAttributesTpl(operation, {id: id.value, ...formState.value});
        emit('submitCallback', result);
        message.success("操作成功");
    } catch (error:any) {
        message.error(error.message);
    } finally {
        emit('update:confirmLoading', false);
    }
};
// 表单提交
const onFormSubmit = () => {
    onSubmit()
};

defineExpose({
    onFormSubmit
});


</script>
<style lang="less" scoped>
.attr-row {
    display: flex;
    margin-bottom: 8px;
}

.attr-list {
    width: 100%;
}

.add_newAttr {
    display: flex;
}

.btn-ico {
    margin-right: 3px;
    font-weight: bold
}

.attr-warp {
    height: 100%;
    padding-bottom: 5px;
    margin-bottom: 13px;
    clear: both;
    display: flex
}

.attr-warp-title {
    text-align: right;
    width: 80px;
    position: relative;
    padding-left: 15px;
}

.attr-warp-title .title {
    position: relative;
    display: inline-block;
    line-height: 24px;
}

.attr-warp-box {
    width: 100%;
}

.btn-remove {
    font-size: 10px;
    background: #f1f1f1;
    border-radius: 20px;
    height: 20px;
    width: 20px;
    text-align: center;
    line-height: 20px;
    color: #666;
    cursor: pointer;
    transition: all .2s;
}

.attr-warp-title .btn-remove {
    background-color: #616161;
    color: #fff;
    display: none;
    width: 12px;
    height: 12px;
    font-size: 6px;
    line-height: 12px;
    margin-right: 3px;
    position: absolute;
    left: -17px;
    top: 6px;
}

.attr-warp:hover .attr-warp-title .btn-remove {
    display: inline-block;
}

.attr-warp:hover .attr-warp-title .btn-remove:hover {
    background-color: var(--el-color-primary);
}

// .pic-select-con :deep .pic-select {
//     display: flex;
//     align-items: center;
//     padding-left: 0;
//     position: relative;
// }

// .pic-select-con :deep .pic-select-img {
//     height: 28px;
//     width: 28px;
//     padding-left: 0;
//     border: 1px solid #ddd;
//     background-color: #fff;
//     border-radius: 2px;
//     cursor: pointer;
//     position: relative;
//     overflow: hidden;
// }

// .pic-select-con :deep .pic-select-img:after {
//     content: '\e637';
//     font-family: 'admin-iconfont';
//     position: absolute;
//     top: 0;
//     line-height: 28px;
//     width: 28px;
//     left: 0;
//     z-index: 1;
//     text-align: center;
//     color: #a6a5a5;
// }

// .pic-select-con :deep .pic-select .pic-select-del {
//     position: absolute;
//     cursor: pointer;
//     right: -10px;
//     top: -10px;
//     color: #fff;
//     background: #dbdbdb;
//     border-radius: 50%;
//     z-index: 2;
//     width: 18px;
//     height: 18px;
//     text-align: center;
//     line-height: 18px;
//     font-size: 12px;
//     display: none;
// }

// .pic-select-con :deep .pic-select:hover .pic-select-del {
//     display: block;
//     background: #333;
// }

// .pic-select-con :deep .pic-select .pic-select-img img {
//     width: 28px;
//     height: 28px;
//     position: relative;
//     z-index: 2;
// }

// .table-product :deep .el-input__wrapper {
//     box-shadow: none;
// }

// .table-product :deep .el-input__inner {
//     text-align: center !important;
// }

.product-batch {
    margin-bottom: 10px;
}
</style>
