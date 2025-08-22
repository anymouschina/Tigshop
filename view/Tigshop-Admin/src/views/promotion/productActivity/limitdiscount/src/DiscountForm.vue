<template>
    <div class="lyecs-product-select-group">
        <el-space>
            <DialogForm
                :params="{ selectedIds: ids, isMultiple: props.isMultiple, isSku: props.isSku, isSelf: 1 }"
                isDrawer
                path="product/product/src/SelectProduct"
                title="选择商品"
                width="600px"
                @okCallback="onOk"
            >
                <el-button :disabled="max > 0 && skuList?.length >= max" type="primary">选择商品</el-button>
            </DialogForm>
            <span v-if="skuList.length > 0" class="ml10">已选择 <b>{{ skuList?.length }}</b> 个商品</span>
            <el-button v-if="skuList.length > 0" @click="clear">清空</el-button>
        </el-space>
        <div v-if="skuList.length > 0 && !loading" class="lyecs-product-selected-con">
            <div class="product-selected-list">
                <div class="product-selected-list-tr product-selected-list-th">
                    <div class="col col1">商品编号</div>
                    <div class="col col4">商品信息</div>
                    <div class="col col1">原价</div>
                    <div class="col col1">优惠方式</div>
                    <div class="col col2">优惠内容</div>
                    <div class="col col3">操作</div>
                </div>
                <template v-for="(item, key) in skuList" :key="key">
                    <div class="product-selected-list-tr">
                        <div class="col col1">{{ item.product.productSn }}</div>
                        <div class="col col4 product-info">
                            <div>
                                <img :src="imageFormat(item.product.picThumb)" height="50" width="50" />
                            </div>
                            <div>
                                <div class="product-name">{{ item.product.productName }}</div>
                                <div class="product-sku" v-if="item.product.productSku !== null && item.product.productSku.length > 0 && item.skuIds">
                                    <el-button type="primary" link size="mini" @click="checkSku(item)">+ 已选{{ item.skuIds.length || 0 }}个规格</el-button>
                                </div>
                            </div>
                        </div>
                        <div class="col col1">
                            <div>{{ priceFormat(item.product.productPrice) }}</div>
                        </div>
                        <div class="col col1" v-if="item.discountType">
                            <el-select
                            v-model="item.discountType"
                            size="mini"
                            >
                                <el-option label="打折" :value="1"/>
                                <el-option label="减钱" :value="2"/>
                                <el-option label="促销" :value="3"/>
                            </el-select>
                        </div>
                        <div class="col col2" v-if="item.discountType">
                            <div class="flex">
                                <div style="margin-right: 5px;" v-if="item.discountType == 2">减</div>
                                <TigInput type="decimal" v-if="item.discountType == 1" :min="0.1" :max="9.9" v-model="item.value" size="mini" width="70px" />
                                <TigInput type="decimal" v-else :min="1" :max="Number(item.product.productPrice)" v-model="item.value" size="mini" width="70px" />
                                <div style="margin-left: 5px;" v-if="item.discountType > 1">元</div>
                                <div style="margin-left: 5px;" v-else>折</div>
                            </div>
                        </div>
                        <div class="col col3">
                            <a class="del-btn" @click="del(key)">删除</a>
                        </div>
                    </div>
                </template>
            </div>
            <div v-if="total > 0" class="pagination-con">
                <Pagination
                    v-model:page="filterParams.page"
                    v-model:size="filterParams.size"
                    :total="total"
                    @callback="loadList"
                    layout="slot ,prev, pager, next"
                    :background="false"
                />
            </div>
        </div>
    </div>
    <el-dialog v-model="skuVisible" title="选择规格" width="500" :before-close="closeSku" :close-on-click-modal="false">
        <SelectSku v-if="skuVisible" ref="skuRef" :productInfo="rowInfo" :isMultiple="isMultiple"></SelectSku>
        <template #footer>
            <div class="dialog-footer">
                <el-button @click="closeSku">取消</el-button>
                <el-button type="primary" @click="submitSku">保存</el-button>
            </div>
        </template>
    </el-dialog>
</template>
<script lang="ts" setup>
import { onMounted, reactive, ref, defineModel } from "vue";
import { DialogForm } from "@/components/dialog";
import { imageFormat, priceFormat } from "@/utils/format";
import { getProductList } from "@/api/product/product";
import { message } from "ant-design-vue";
import { ProductFilterParams, type ProductFilterState } from "@/types/product/product";
import { useConfigStore } from "@/store/config";
import { Pagination } from "@/components/list";
import SelectSku from "@/views/promotion/productGift/src/SelectSku.vue"
// 传值
const props = defineProps({
    // 传入需要显示的商品list
    max: { type: Number, default: -1 },
    // 单选还是多选
    isMultiple: {
        type: Boolean,
        default: true
    },
    // 是否选择规格, 默认单选
    isSku: {
        type: Boolean,
        default: false
    }
});
const skuVisible = ref<boolean>(false)
const ids = defineModel<number[]>("ids", { type: Array, default: [] });
const skuIds = defineModel("skuIds", {type: Array, default: []});
const skuList = ref<any[]>([])
onMounted(async () => {
    if (ids.value && ids.value.length > 0) {
        await loadList(ids.value);
    }else{
        ids.value = [];
    }
    if (skuIds.value && skuIds.value.length > 0) {
        skuList.value = skuIds.value;
        skuIds.value.forEach((item:any) => {
            ids.value.push(item.productId)
        })
        loading.value = false;
    }else{
        skuList.value = []
    }
});
// 商品列表
const total = ref(0);
const rowInfo = ref<any>({})
const config = useConfigStore();
const loading = ref<boolean>(true);
const filterParams = reactive<ProductFilterParams>({
    page: 1,
    size: config.get("pageSize") as number,
    sortField: "",
    sortOrder: "",
    keyword: ""
});
const loadList = async (id: number[]) => {
    loading.value = true;
    try {
        const result = await getProductList({ ids: id.join(','), ...filterParams });
        result.records.forEach((item: any) => {
            skuList.value.forEach((sku: any) => {
                if(sku.productId === item.productId){
                    sku.product = item
                }
            })
        });
        skuIds.value = skuList.value;
        total.value = result.total;
    } catch (error: any) {
        message.error(error.message);
    } finally {
        loading.value = false;
    }
};
const onOk = (e: any) => {
    let _list = ids.value;
    if (props.isMultiple == false) {
        _list = [];
    }
    if(props.isSku){
        for (let index in e) {
            _list.push(e[index].productId);
            e[index].discountType = 1;
            e[index].value = ''
            skuList.value.push(e[index])
        }
    }
    console.log(skuList.value)
    ids.value = _list;
    loadList(_list);
};
// 清空
const clear = () => {
    skuList.value = [];
    ids.value = [];
};
// 删除
const del = (key: number) => {
    let del_productId = skuList.value[key].productId;
    ids.value = ids.value.filter((num) => num !== del_productId);
    skuList.value.splice(<any>key, 1);
    skuIds.value.splice(<any>key, 1);
};
const checkSku = (item: any) => {
    item.product.skuIds = item.skuIds;
    rowInfo.value = item.product;
    skuVisible.value = true;
}
const closeSku = () => {
    rowInfo.value = "";
    skuVisible.value = false;
}
const skuRef: any = ref();
const submitSku = () => {
    if(skuRef.value.skuIds.length > 0){
        skuList.value.forEach((item:any) => {
            if (item.productId == rowInfo.value.productId) {
                item.skuIds = skuRef.value.skuIds;
            }
        })
        rowInfo.value = "";
        skuVisible.value = false;
    }else{
        message.error('请选择规格')
    }
}
defineExpose({
    ids,
    skuList
});
</script>

<style lang="less" scoped>
.all_brand {
    padding: 8px;
}

.all_brand ul {
    display: flex;
    flex-wrap: wrap;
    width: 290px;
}

.all_brand li a {
    padding: 2px 7px;
    display: inline-block;
    border-radius: 3px;
    line-height: 20px;
}

.all_brand li a:hover {
    background: #f4f4f4;
}

/*商品选择器*/
.lyecs-product-select-group {
    margin-bottom: 0;
    width: 100%;
    :deep(.el-select__wrapper){
        width: 80px !important;
    }
}

.lyecs-product-select-group .lyecs-product-selected-con {
    max-width: 710px;
    position: relative;
    padding-top: 50px;
    margin-top: 10px;
}

.lyecs-product-select-group .clear-btn {
    margin-left: 20px;
}

.lyecs-product-select-group .desc {
    margin-left: 20px;
    color: #999;
}

.lyecs-product-select-group .product-selected-list {
    margin-bottom: 20px;
    max-height: 550px;
    overflow-y: auto;
    min-width: 400px;
}

.lyecs-product-select-group .product-selected-list-tr {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    border-bottom: 1px solid #f0f0f0;
}

.lyecs-product-select-group .product-selected-list-tr .product-name {
    width: 160px;
    margin-right: 20px;
    line-height: 18px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    text-overflow: ellipsis;
}
.lyecs-product-select-group .product-selected-list-tr .product-sku {
    color: #999;
    cursor: pointer;
}

.lyecs-product-select-group .product-selected-list-th {
    color: #333;
    font-weight: bold;
    position: absolute;
    top: 0;
    width: 100%;
    background: #fff;
    height: 50px;
}

.lyecs-product-select-group .product-selected-list-tr .col1 {
    width: 100px;
}

.lyecs-product-select-group .product-selected-list-tr .col2 {
    width: 220px;
}

.lyecs-product-select-group .product-selected-list-tr .col4 {
    width: 300px;
}

.lyecs-product-select-group .product-selected-list-tr .col3 {
    width: 80px;
}

.lyecs-product-select-group .product-selected-list-tr .product-info {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    padding: 5px 0;
}

.lyecs-product-select-group .product-selected-list-tr .product-info img {
    margin-right: 10px;
}
@media only screen and (max-width: 767px) {
    .lyecs-product-selected-con {
        overflow-x: auto;
        max-width: 100% !important;
    }
    .lyecs-product-select-group .product-selected-list {
        min-width: auto;
    }
    .lyecs-product-select-group .product-selected-list-tr .col1 {
        width: 50px;
        word-break: break-all;
    }
    .lyecs-product-select-group .product-selected-list-tr .col3 {
        width: 30px;
    }
    .lyecs-product-select-group .product-selected-list-tr .product-info {
        flex-wrap: wrap;
    }
}
</style>
