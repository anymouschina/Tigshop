<template>
    <div class="lyecs-product-select-group">
        <el-space>
            <DialogForm :params="{ selectedIds: productList, isMultiple: false }" isDrawer path="product/product/src/SelectProduct" title="选择商品" width="600px" @okCallback="onOk">
                <el-button :disabled="showProductList?.length>0" type="primary">选择商品</el-button>
            </DialogForm>
            <el-button v-if="showProductList?.length > 0" @click="clear">清空</el-button>
        </el-space>
        <div v-if="showProductList?.length > 0&&loading" class="lyecs-product-selected-con">
            <div class="product-selected-list">
                <div class="product-selected-list-tr product-selected-list-th">
                    <div class="col col2">商品信息</div>
                    <div class="col col1">秒杀价</div>
                    <div class="col col1">秒杀库存</div>
                    <div class="col col3">操作</div>
                </div>
                <template v-for="(item, key) in showProductList">
                    <div class="product-selected-list-tr">
                        <div class="col col2 product-info">
                            <div style="display: flex">
                                <img :src="imageFormat(item.picThumb)" height="50" width="50">
                                <span style="line-height: 2">{{ item.productName }}</span>
                            </div>
                            <ul>
                                <li v-for="it in item.skuData">{{ it.name }}：{{ it.value }}</li>
                            </ul>
                        </div>
                        <div class="col col1">
                            <TigInput type="decimal" v-model="item.seckillPrice"></TigInput>
                            <div class="extra">价格(元)：{{ item.skuPrice }}</div>
                        </div>
                        <div class="col col1">
                            <TigInput type="integer" v-model="item.seckillStock"></TigInput>
                            <div class="extra">现有库存：{{ item.skuStock }}</div>
                        </div>
                        <div class="col col3">
                            <el-button v-if="item.secondsSeckill" :type="item.tipValue=='取消参加'?'danger':'primary'" link @click="del(key)" @mouseout="item.tipValue='已参加'" @mouseover="item.tipValue='取消参加'">{{ item.tipValue }}</el-button>
                            <el-button v-else link type="primary" @click="del(key)">参加秒杀</el-button>
                        </div>
                    </div>
                </template>

            </div>
            <div class="batch">
                <span>批量设置：</span>
                <div v-if="inventory&&price" @click="price = !price">秒杀价格</div>
                <div v-else-if="!price" class="setting">
                    <TigInput type="decimal" v-model="_price" placeholder="请输入秒杀价格"></TigInput>
                    <el-button link type="primary" @click="saveBatch(1)">保存</el-button>
                    <el-button link type="primary" @click="price = !price">取消</el-button>
                </div>
                <div v-if="inventory&&price" @click="inventory = !inventory">秒杀库存</div>
                <div v-else-if="!inventory" class="setting">
                    <TigInput type="integer" v-model="_inventory" placeholder="请输入秒杀库存"></TigInput>
                    <el-button link type="primary" @click="saveBatch(2)">保存</el-button>
                    <el-button link type="primary" @click="inventory = !inventory">取消</el-button>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { defineModel, onMounted, reactive, ref, watch } from "vue";
import { DialogForm } from "@/components/dialog";
import { imageFormat } from "@/utils/format";
import { getProduct } from "@/api/product/product";
import { message } from "ant-design-vue";
import { useConfigStore } from "@/store/config";
import type { SeckillProductState } from "@/types/promotion/seckill";
// 传值
const productId = defineModel<Number>("productId", { default: () => (0) });
const verify = defineModel<Number>("verify", { default: () => false });
const productList = defineModel<Array<SeckillProductState>>("productList", { default: () => ([]) });
const showProductList :any= ref([])
const loadingProduct = ref<boolean>(false);
const loading = ref<boolean>(true);

onMounted(() => {

});


const price = ref(true);
const inventory = ref(true);
const _price = ref<string>("");
const _inventory = ref<number>();
const saveBatch = (type: number) => {
    if (type === 1) {
        showProductList.value.forEach((item: any) => {
            if (item.secondsSeckill) {
                item.seckillPrice = _price.value;
            }
        });
        _price.value = "";
        price.value = !price.value;
    } else {
        showProductList.value.forEach((item: any) => {
            if (item.secondsSeckill) {
                item.seckillStock = _inventory.value;
            }
        });
        _inventory.value = undefined;
        inventory.value = !inventory.value;
    }
};

//点击确认保存的商品
const onOk = (e: number[]) => {
    productId.value = e[0];
    loadSkuList();
    //根据id去查询他的sku信息
};
//清空已经选择的商品
const clear = () => {
    showProductList.value = [];
};

// 删除
const del = (key: number) => {
    showProductList.value[key].secondsSeckill = showProductList.value[key].secondsSeckill ? 0 : 1;
};

const loadSkuList = async () => {
    loadingProduct.value = true;
    try {
        const result = await getProduct("detail", { id: productId.value });
        console.log(result.productList);
        let tempArray: any = result;
        if (tempArray.productList.length == 0) {
            let temp: any = {};
            temp.secondsSeckill = 1;
            temp.tipValue = "已参加";
            temp.seckillPrice = '';
            temp.seckillStock = '';
            temp.picThumb = tempArray.picThumb;
            temp.productName = tempArray.productName;
            temp.skuPrice = tempArray.productPrice;
            temp.skuStock = tempArray.productStock;
            showProductList.value.push(temp);
        } else {
            tempArray.productList?.forEach((item: any) => {
                let temp: any = {};
                temp.secondsSeckill = 1;
                temp.tipValue = "已参加";
                temp.seckillPrice = '';
                temp.seckillStock = '';
                temp.picThumb = tempArray.picThumb;
                temp.productName = tempArray.productName;
                temp.skuPrice = item.skuPrice;
                temp.skuStock = item.skuStock;
                temp.skuId = item.skuId;
                temp.skuData = item.skuData;
                showProductList.value.push(temp);
            });
        }

    } catch (error: any) {
        message.error(error.message);
    } finally {
        loadingProduct.value = false;
    }
};


watch(() => showProductList.value, (newValue) => {
    console.log(newValue);
    let tempArray:any = [];
    if(newValue.length >0){
        if(newValue[0].skuId){
            newValue.forEach((item:any)=>{
                let temp:any = {};
                if(item.secondsSeckill){
                    temp.skuId = item.skuId;
                    temp.seckillPrice = item.seckillPrice;
                    temp.seckillStock = item.seckillStock;
                    tempArray.push(temp)
                }
            })
        }else{

        }

        productList.value = tempArray;
    }

},{deep:true,immediate:true})
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

    .lyecs-product-selected-con {
        max-width: 710px;
        position: relative;
        padding-top: 50px;
        margin-top: 10px;
    }

    .clear-btn {
        margin-left: 20px;
    }

    .desc {
        margin-left: 20px;
        color: #999;
    }

    .product-selected-list {
        margin-bottom: 20px;
        max-height: 550px;
        overflow-y: auto;
        min-width: 400px;

        .product-selected-list-tr {
            display: flex;
            flex-wrap: nowrap;
            align-items: center;
            border-bottom: 1px solid #f0f0f0;

            .col {
                padding: 10px;
            }

            .col1 {
                width: 100px;
            }

            .col2 {
                flex: 1;
            }

            .col3 {
                width: 80px;
            }

            .product-info {
                display: flex;
                flex-wrap: nowrap;
                flex-direction: column;
                align-items: center;
                gap: 8px;

                & > ul {
                    width: 100%;
                    line-height: 1.5;
                }
            }

            .product-info img {
                margin-right: 10px;
            }

        }

        .product-selected-list-th {
            color: #333;
            font-weight: bold;
            position: absolute;
            top: 0;
            width: 100%;
            background: #fff;
            height: 50px;
        }


    }
    .batch {
        display: flex;
        gap: 10px;
        margin-top: 20px;

        & > div {
            color: #155bd4;
            cursor: pointer;
        }

        .setting {
            display: flex;
            gap: 8px;
        }
    }
}

</style>
