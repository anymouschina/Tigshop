<template>
  <tig-layout title="扫码点餐" :bg="'#f5f5f5'">
    <view class="entry" v-if="stage==='loading'">
      <view class="loading-text">正在识别桌号...</view>
    </view>
    <view class="entry" v-else-if="stage==='error'">
      <view class="error-text">{{ errorMsg }}</view>
      <button class="retry" @click="retry">重试</button>
    </view>
    <view class="entry" v-else>
      <view class="table-box">
        <view class="table-no">桌号：{{ tableInfo.tableNo }}</view>
        <view class="table-area" v-if="tableInfo.area">区域：{{ tableInfo.area }}</view>
        <view class="people-row">
          <text class="lbl">用餐人数：</text>
          <view class="pc-ops">
            <button class="pc-btn" :disabled="peopleCount<=1" @click="peopleCount--">-</button>
            <text class="pc-val">{{ peopleCount }}</text>
            <button class="pc-btn" :disabled="peopleCount>=12" @click="peopleCount++">+</button>
          </view>
        </view>
        <view class="tips">请选择商品开始点单</view>
        <view class="actions">
          <button class="primary" @click="goMenu(2)">堂食点单</button>
          <button class="outline" @click="goMenu(3)">打包外带</button>
        </view>
      </view>
    </view>
  </tig-layout>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
// 复用全局 request 基础域名，避免首次进入小程序时 storage 尚未写入导致 base 为空
// @ts-ignore
import { baseUrl } from '@/utils/request';

interface TableInfo { id:number; shopId:number; tableNo:string; area?:string; capacity?:number; qrCodeKey:string }
const stage = ref<'loading'|'ready'|'error'>('loading');
const errorMsg = ref('');
const tableInfo = ref<TableInfo>({ id:0, shopId:0, tableNo:'', qrCodeKey:'' });
let sceneKey = '';
const peopleCount = ref(1);

onLoad((query:any)=> {
  logOnLoad('index', query);
  // 微信扫码进入时 query.scene 可能包含 t=XXXX
  // 管理端生成二维码时 scene = t=<qr_code_key>
  if(query.scene){
    try {
      const decoded = decodeURIComponent(query.scene);
      const m = decoded.match(/t=([A-Za-z0-9_-]+)/);
      if(m) sceneKey = m[1];
    } catch(e) {}
  }
  if(query.t){ sceneKey = query.t; }
  if(!sceneKey){ stage.value='error'; errorMsg.value='未识别到桌号'; return; }
  resolveTable();
});

function resolveTable(){
  stage.value='loading';
  const origin = (baseUrl||'').replace(/\/$/,'');
  // 按优先级尝试两条路径：1) 无前缀（现有 /qrcode 路由） 2) 带 /api 前缀（兼容未来网关或反向代理统一前缀场景）
  const paths = ['/qrcode/table/resolve','/api/qrcode/table/resolve'];
  let tried = 0;
  const tryNext = ()=>{
    if(tried>=paths.length){ stage.value='error'; if(!errorMsg.value) errorMsg.value='网络异常，请稍后再试'; return; }
    const p = paths[tried++];
    const url = origin + p + `?key=${encodeURIComponent(sceneKey)}`;
    console.log('[DINE][index] resolving table url=', url);
    uni.request({
      url,
      method: 'GET',
      success(res){
        const data:any = res.data;
        if(data && data.code===0){
          tableInfo.value = data.data;
          stage.value = 'ready';
        } else {
          // 若第一条路径 404/400，再试下一条；其他错误直接显示
            if((res.statusCode===404 || res.statusCode===400) && tried<paths.length){
              console.warn('[DINE][index] first path failed status', res.statusCode, 'try next');
              tryNext();
              return;
            }
            stage.value='error';
            errorMsg.value = data?.message || '桌号无效';
        }
      },
      fail(err){
        console.error('[DINE][index] resolve request fail', err);
        if(tried<paths.length){ tryNext(); return; }
        stage.value='error'; errorMsg.value='网络异常，请稍后再试';
      }
    });
  };
  tryNext();
}

function retry(){ resolveTable(); }

function goMenu(orderType:2|3){
  uni.redirectTo({ url: `/pages/dine/menu?shopId=${tableInfo.value.shopId}&table=${tableInfo.value.tableNo}&type=${orderType}&pc=${peopleCount.value}` });
}

function logOnLoad(tag:string, q:any){
  try {
    const pages = getCurrentPages();
    const cur:any = pages[pages.length-1];
    const route = cur?.route || cur?.__route__ || '';
    const fullPath = cur?.$page?.fullPath || '';
    console.log(`[DINE][${tag}] onLoad route="${route}" fullPath="${fullPath}" query=`, q);
  } catch(e){
    console.log(`[DINE][${tag}] onLoad (no pages API) query=`, q);
  }
}
</script>
<style scoped lang="scss">
.entry { padding:40rpx; }
.loading-text { color:#888; font-size:28rpx; }
.error-text { color:#ff4d4f; font-size:28rpx; margin-bottom:40rpx; }
.retry { background:#fff;border:1px solid #ddd; padding:16rpx 32rpx; border-radius:8rpx; }
.table-box { background:#fff; padding:48rpx 40rpx 60rpx; border-radius:24rpx; text-align:center; box-shadow:0 8rpx 24rpx rgba(0,0,0,0.04); }
.table-no { font-size:48rpx; font-weight:600; color:#333; }
.table-area { margin-top:12rpx; font-size:26rpx; color:#666; }
.people-row { margin-top:30rpx; display:flex; justify-content:center; align-items:center; font-size:28rpx; color:#333; }
.people-row .lbl { margin-right:12rpx; }
.pc-ops { display:flex; align-items:center; gap:22rpx; }
.pc-btn { background:#f6f6f6; border:none; width:64rpx; height:64rpx; border-radius:16rpx; font-size:40rpx; line-height:64rpx; text-align:center; }
.pc-btn:disabled { opacity:0.4; }
.pc-val { min-width:40rpx; text-align:center; font-weight:600; }
.tips { margin-top:28rpx; font-size:26rpx; color:#999; }
.actions { display:flex; gap:32rpx; justify-content:center; margin-top:54rpx; }
button { line-height:1; }
.primary { background: var(--general,#ff5500); color:#fff; padding:26rpx 48rpx; font-size:30rpx; border:none; border-radius:50rpx; font-weight:600; }
.outline { background:#fff; color: var(--general,#ff5500); padding:26rpx 48rpx; font-size:30rpx; border:2rpx solid var(--general,#ff5500); border-radius:50rpx; font-weight:600; }
</style>
