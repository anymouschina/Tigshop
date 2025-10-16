<template>
  <tig-layout title="扫码点餐" :bg="'#f5f5f5'">
    <!-- Scan call-to-action -->
    <view class="scan-card">
      <view class="scan-icon"><text class="iconfont-h5 icon-erweima" /></view>
      <view class="scan-title">扫一扫桌码</view>
      <view class="scan-sub">将相机对准桌贴二维码</view>
      <tig-button class="scan-btn" :custom-style="{ height: '88rpx', 'border-radius': '28rpx', 'font-size': '30rpx' }" @click="handleScan">立即扫码</tig-button>
    </view>
    <view class="entry" v-if="stage==='loading'">
      <view class="loading-text">正在识别桌号...</view>
    </view>
    <view class="entry" v-else-if="stage==='error'">
      <view class="error-text">{{ errorMsg }}</view>
      <tig-button class="retry" plain :custom-style="{ 'border-radius': '16rpx', height: '80rpx' }" @click="retry">重试</tig-button>
      <view class="retry-tip">或重新扫码</view>
      <tig-button class="scan-btn minor" :custom-style="{ height: '80rpx', 'border-radius': '20rpx' }" @click="handleScan">重新扫码</tig-button>
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
          <tig-button class="primary" :custom-style="{ 'border-radius': '50rpx', height: '88rpx', 'font-size': '30rpx' }" @click="goMenu(2)">堂食点单</tig-button>
          <tig-button class="outline" plain :custom-style="{ 'border-radius': '50rpx', height: '88rpx', 'font-size': '30rpx' }" @click="goMenu(3)">打包外带</tig-button>
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

function handleScan(){
  const extractKey = (payload:any): string => {
    try {
      // 1) 优先从 path 的 scene 中解析（WX_CODE 常见）
      const path = payload?.path as string;
      if (path && path.includes('scene=')) {
        const sceneMatch = path.match(/[?&#]scene=([^&#]+)/);
        if (sceneMatch && sceneMatch[1]) {
          const sceneDecoded = decodeURIComponent(sceneMatch[1]); // e.g. "t=ST55761EB"
          const tMatch = sceneDecoded.match(/(?:^|[?&#])t=([A-Za-z0-9_-]+)/);
          if (tMatch) return tMatch[1];
        }
      }

      // 2) 从 result 解析 URL 或纯 key
      let raw = String(payload?.result || '');
      if (/%[0-9A-Fa-f]{2}/.test(raw)) {
        try { raw = decodeURIComponent(raw); } catch(_) {}
      }
      let m = raw.match(/[?&#]t=([A-Za-z0-9_-]+)/);
      if (m) return m[1];
      m = raw.match(/(?:scene=)?t=([A-Za-z0-9_-]+)/);
      if (m) return m[1];
      if (/^[A-Za-z0-9_-]{6,}$/.test(raw)) return raw;

      // 3) 尝试从 rawData 解析（部分平台 base64/ISO8859-1）
      let rd = payload?.rawData ? String(payload.rawData) : '';
      if (rd) {
        // 简单判断 base64
        if (/^[A-Za-z0-9+/=]+$/.test(rd)) {
          try {
            // @ts-ignore atob 在 H5 可用；小程序不可用时会抛错，catch 即可
            const decoded = atob(rd);
            let s = decoded;
            if (/%[0-9A-Fa-f]{2}/.test(s)) { try { s = decodeURIComponent(s); } catch(_) {} }
            let mm = s.match(/[?&#]t=([A-Za-z0-9_-]+)/);
            if (mm) return mm[1];
            mm = s.match(/(?:scene=)?t=([A-Za-z0-9_-]+)/);
            if (mm) return mm[1];
            if (/^[A-Za-z0-9_-]{6,}$/.test(s)) return s;
          } catch(_) {}
        } else {
          // 非 base64，当普通字符串尝试
          let s = rd;
          if (/%[0-9A-Fa-f]{2}/.test(s)) { try { s = decodeURIComponent(s); } catch(_) {} }
          let mm = s.match(/[?&#]t=([A-Za-z0-9_-]+)/);
          if (mm) return mm[1];
          mm = s.match(/(?:scene=)?t=([A-Za-z0-9_-]+)/);
          if (mm) return mm[1];
        }
      }
    } catch(_) {}
    return '';
  };

  uni.scanCode({
    onlyFromCamera: true,
    scanType: ['qrCode','barCode','datamatrix','pdf417'],
    success(res){
      const key = extractKey(res);
      if(!key){ uni.showToast({ title:'未识别到有效桌码', icon:'none' }); return; }
      sceneKey = key;
      resolveTable();
    },
    fail(){
      uni.showToast({ title:'已取消扫码', icon:'none' });
    }
  });
}

function goMenu(orderType:2|3){
  // 跳转到分类布局版点餐页面（新的菜单界面）
  uni.redirectTo({ url: `/pages/dine/menuCate?shopId=${tableInfo.value.shopId}&table=${tableInfo.value.tableNo}&type=${orderType}&pc=${peopleCount.value}` });
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
.scan-card {
  margin: 28rpx 28rpx 0;
  padding: 36rpx 28rpx 40rpx;
  border-radius: 28rpx;
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
  box-shadow: 0 12rpx 30rpx rgba(0,0,0,0.06);
  text-align: center;
}
.scan-icon {
  width: 120rpx; height: 120rpx; margin: 10rpx auto 8rpx;
  border-radius: 28rpx; background: #f4f5f7;
  display:flex; align-items:center; justify-content:center;
  .iconfont-h5 { font-size: 56rpx; color:#1c1c1e; opacity:0.86; }
}
.scan-title { font-size:34rpx; font-weight:600; color:#111; margin-top: 8rpx; }
.scan-sub { font-size:24rpx; color:#8e8e93; margin: 6rpx 0 18rpx; }
.scan-btn { width:70%; margin: 0 auto; background: var(--general,#1c1c1e); color:#fff; }
.scan-btn.minor { width:60%; background:#1c1c1e; color:#fff; }
.entry { padding:40rpx; }
.loading-text { color:#888; font-size:28rpx; }
.error-text { color:#ff4d4f; font-size:28rpx; margin-bottom:20rpx; text-align:center; }
.retry { width: 50%; margin: 0 auto; }
.retry-tip { text-align:center; color:#999; font-size:24rpx; margin: 16rpx 0 8rpx; }
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
.primary { width: 40%; }
.outline { width: 40%; }
</style>
