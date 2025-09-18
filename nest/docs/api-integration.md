# TigShop API 集成文档

## 基础信息

- **API Base URL**: `http://localhost:3001`
- **API 文档**: `http://localhost:3001/api-docs`
- **认证方式**: JWT Bearer Token
- **文件上传路径**: `/uploads/`

## 认证接口

### 1. 微信登录
```http
POST /api/auth/wechat-login
Content-Type: application/json

{
  "code": "微信授权码",
  "userInfo": {
    "nickName": "用户昵称",
    "avatarUrl": "头像URL"
  }
}
```

### 2. 邮箱注册
```http
POST /api/auth/email-register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "nickname": "用户昵称"
}
```

### 3. 邮箱登录
```http
POST /api/auth/email-login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### 4. 邮箱验证
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

### 5. 发送验证码
```http
POST /api/auth/send-verification-code
Content-Type: application/json

{
  "email": "user@example.com",
  "type": "register|reset_password"
}
```

## 商品接口

### 1. 获取商品列表
```http
GET /api/products?page=1&size=20&categoryId=1&keyword=搜索词&minPrice=0&maxPrice=1000&sort=sales&order=desc
Authorization: Bearer {token}
```

### 2. 获取商品详情
```http
GET /api/products/{id}
Authorization: Bearer {token}
```

### 3. 获取商品规格
```http
GET /api/products/{id}/specs
Authorization: Bearer {token}
```

### 4. 获取商品属性
```http
GET /api/products/{id}/attributes
Authorization: Bearer {token}
```

## 购物车接口

### 1. 添加到购物车
```http
POST /api/cart/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "productId": 1,
  "skuId": 1,
  "quantity": 1
}
```

### 2. 获取购物车列表
```http
GET /api/cart
Authorization: Bearer {token}
```

### 3. 更新购物车数量
```http
PUT /api/cart/update/{itemId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "quantity": 2
}
```

### 4. 删除购物车商品
```http
DELETE /api/cart/remove/{itemId}
Authorization: Bearer {token}
```

## 订单接口

### 1. 创建订单
```http
POST /api/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "items": [
    {
      "productId": 1,
      "skuId": 1,
      "quantity": 1
    }
  ],
  "consignee": "收货人姓名",
  "mobile": "手机号",
  "address": "收货地址",
  "shippingType": "express",
  "payTypeId": 1,
  "buyerNote": "买家备注"
}
```

### 2. 获取订单列表
```http
GET /api/orders?page=1&size=20&status=all
Authorization: Bearer {token}
```

### 3. 获取订单详情
```http
GET /api/orders/{id}
Authorization: Bearer {token}
```

### 4. 取消订单
```http
PUT /api/orders/{id}/cancel
Authorization: Bearer {token}
```

### 5. 确认收货
```http
PUT /api/orders/{id}/receive
Authorization: Bearer {token}
```

## 支付接口

### 1. 创建支付
```http
POST /api/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "orderId": 1,
  "paymentMethod": "alipay|wechat|credit_card",
  "amount": 100.00
}
```

### 2. 查询支付状态
```http
GET /api/payments/{id}/status
Authorization: Bearer {token}
```

### 3. 取消支付
```http
PUT /api/payments/{id}/cancel
Authorization: Bearer {token}
```

### 4. 申请退款
```http
POST /api/payments/{id}/refund
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 100.00,
  "reason": "退款原因"
}
```

## 文件上传接口

### 1. 上传单个文件
```http
POST /api/upload/single
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [文件]
type: product|user|category|brand|order|other
relatedId: 1 (可选)
description: 文件描述 (可选)
```

### 2. 批量上传文件
```http
POST /api/upload/multiple
Authorization: Bearer {token}
Content-Type: multipart/form-data

files: [文件数组]
type: product|user|category|brand|order|other
relatedId: 1 (可选)
description: 文件描述 (可选)
```

### 3. 获取我的文件列表
```http
GET /api/upload/my-files?page=1&size=20&type=product
Authorization: Bearer {token}
```

## 通知接口

### 1. 发送通知
```http
POST /api/notification/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": 1,
  "type": "email|sms|system|wechat|push",
  "template": "order_confirmed|payment_success|custom",
  "title": "通知标题",
  "content": "通知内容",
  "templateData": {},
  "sendImmediately": true,
  "priority": "low|normal|high"
}
```

### 2. 获取我的通知
```http
GET /api/notification/my-notifications?page=1&size=20&type=email
Authorization: Bearer {token}
```

### 3. 标记通知已读
```http
PUT /api/notification/mark-read/{id}
Authorization: Bearer {token}
```

### 4. 标记所有通知已读
```http
PUT /api/notification/mark-all-read
Authorization: Bearer {token}
```

## 统计接口

### 1. 获取商品统计
```http
GET /api/products/statistics
Authorization: Bearer {token}
```

### 2. 获取订单统计
```http
GET /api/orders/statistics
Authorization: Bearer {token}
```

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 422 | 数据验证失败 |
| 500 | 服务器内部错误 |

## 响应格式

### 成功响应
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    // 响应数据
  }
}
```

### 错误响应
```json
{
  "code": 400,
  "message": "错误信息",
  "error": "详细错误信息"
}
```

## 分页格式

```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "size": 20,
    "totalPages": 5
  }
}
```

## Uni-app 集成建议

### 1. 网络请求封装
```javascript
// 封装请求工具
const request = {
  baseURL: 'http://localhost:3001',

  async request(options) {
    const token = uni.getStorageSync('token');

    const response = await uni.request({
      url: this.baseURL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.header
      }
    });

    return response[1].data;
  }
};
```

### 2. 文件上传封装
```javascript
const upload = {
  async uploadFile(filePath, type, relatedId) {
    const token = uni.getStorageSync('token');

    const result = await uni.uploadFile({
      url: 'http://localhost:3001/api/upload/single',
      filePath: filePath,
      name: 'file',
      formData: {
        type: type,
        relatedId: relatedId
      },
      header: {
        'Authorization': `Bearer ${token}`
      }
    });

    return JSON.parse(result[1].data);
  }
};
```

### 3. 错误处理
```javascript
// 统一错误处理
function handleError(error) {
  const { code, message } = error;

  switch (code) {
    case 401:
      // 跳转登录页
      uni.navigateTo({
        url: '/pages/login/login'
      });
      break;
    case 403:
      uni.showToast({
        title: '权限不足',
        icon: 'none'
      });
      break;
    default:
      uni.showToast({
        title: message || '请求失败',
        icon: 'none'
      });
  }
}
```