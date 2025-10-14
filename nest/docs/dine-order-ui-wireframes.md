# Dine Order UI Wireframes (ASCII Draft)

> 初稿：统一命名 & 区块结构；后续在 Admin / Uni-app 两端保持区块与组件语义一致。

## Admin: 1. Dine Orders Dashboard
```
+----------------------------------------------------------------------------------+
| Filters: [Date Range][Shop][ServiceState ▼][OrderType ▼][TableNo][PickupNo][Search]|
+----------------------------------------------------------------------------------+
| OrderID | Pickup | Table | Type | ServiceState | Amount | Items | Paid | Actions  |
|---------|--------|-------|------|--------------|--------|-------|------|----------|
| 10567   | 025    | A12   | DINE | READY        | 128.00 | 5     | YES  | [Detail] |
| 10568   | 026    | ---   | TAKE | IN_PROGRESS  | 36.00  | 2     | YES  | [Detail] |
| 10569   | 027    | B03   | DINE | CREATED      | 88.00  | 4     | NO   | [Pay][Cancel] |
+----------------------------------------------------------------------------------+
| Legend: Type: DINE=堂食 TAKE=外带 | ServiceState color tags | Auto refresh: 5s      |
+----------------------------------------------------------------------------------+
```

## Admin: 2. Order Detail (主单 + 加单聚合)
```
+---------------------------------- Order #10567 (Pickup 025) ----------------------------------+
| Table: A12 | DineScene: DINE_IN | People: 3 | ServiceState: READY | Paid: YES                 |
| Timeline: CREATED -> IN_PROGRESS -> READY                                                         |
+-----------------------------------------------------------------------------------------------+
| Aggregated Items (Main + Appends)                                                               |
| Product            | SKU        | Qty | Unit | Subtotal | Source (Main/Append#)                |
|--------------------|------------|-----|------|----------|--------------------------------------|
| Black Coffee       | Default    | 2   | 18   | 36.00    | Main                                 |
| Cheesecake Slice   | Default    | 3   | 12   | 36.00    | Append#1                             |
| Pasta Carbonara    | Default    | 2   | 28   | 56.00    | Main                                 |
+-----------------------------------------------------------------------------------------------+
| Subtotals: Product=128.00  ServiceFee=0  Discount=0  Total=128.00  Paid=128.00  Unpaid=0       |
| Actions: [Change Table] [Append Items] [Advance State] [Cancel] [Print]                         |
| Logs: CREATE (10:01) -> PAY (10:02) -> STATE_CHANGE(IN_PROGRESS) -> STATE_CHANGE(READY)         |
+-----------------------------------------------------------------------------------------------+
```

## Admin: 3. Shop Tables Management
```
+------------------ Tables (Shop: #12) ------------------+
| TableNo | Area  | Capacity | Status | Active Orders | Actions    |
|---------|-------|----------|--------|---------------|------------|
| A01     | Hall  | 4        | ON     | 1             | [Edit][QR] |
| A02     | Hall  | 4        | ON     | 0             | [Edit][QR] |
| B03     | Window| 2        | OFF    | 0             | [Edit]     |
+--------------------------------------------------------+
| [Add Table]  | Bulk: [Enable][Disable][Generate All QR] |
+--------------------------------------------------------+
```

## Admin: 4. Kitchen / Queue Screen
```
+------------------------------ Active Queue (Auto Refresh 3s) ------------------------------+
| Pickup | Type | Table | State       | Elapsed | Items | Actions (Kitchen)                  |
| 025    | DINE | A12   | READY       | 07:12   | 5     | [Serve]                            |
| 026    | TAKE | ---   | IN_PROGRESS | 03:40   | 2     | [Mark Ready]                       |
| 027    | DINE | B03   | CREATED     | 01:15   | 4     | [Accept->IN_PROGRESS] [Cancel]     |
+--------------------------------------------------------------------------------------------+
| Color Legend: CREATED(gray) IN_PROGRESS(blue) READY(yellow) SERVED(green) LATE(red blink)   |
+--------------------------------------------------------------------------------------------+
```

## Uni-app: 1. Entry / Scene Selection
```
+---------------------- Scan Entry -----------------------+
| 识别二维码: shop=12 table=A12 (可编辑)                   |
| 人数: [ 3 ]  (仅堂食显示)                               |
| 用餐方式: (●) 堂食  (○) 外带                            |
| 备注: [ 口味清淡 少糖 ]                                 |
| [进入点餐]                                             |
+--------------------------------------------------------+
```

## Uni-app: 2. Menu / Ordering
```
+----------------- 菜单 (Tab: 热销 / 主食 / 饮品) -----------------+
| 搜索: [ 输入关键字 ]                                             |
| ---------------------------------------------------------------- |
| 菜品卡片: 名称 价格 [+]                                          |
| ...                                                              |
| 固定底栏: 购物车(共5件 ¥128.00) [查看/下单]                     |
+------------------------------------------------------------------+
```

## Uni-app: 3. Cart / Confirm
```
+---------------------- 当前点餐 ----------------------+
| 桌号 A12 取号 025 | 人数 3 | 状态: IN_PROGRESS       |
| 项目:                                                |
|  - Black Coffee x2  ¥36  [-][2][+]                  |
|  - Pasta x2         ¥56  (不可直接改)                |
|  - 添加备注: [ 少盐 ]                                 |
| 合计: ¥128.00                                        |
| [继续点]  [去支付]                                   |
+------------------------------------------------------+
```

## Uni-app: 4. Payment
```
+---------------- 支付 ----------------+
| 应付金额: ¥128.00                    |
| 支付方式: [微信支付] [余额]          |
| [立即支付]                            |
+---------------------------------------+
```

## Uni-app: 5. Order Status / Timeline
```
+------------------ 订单进度 (#10567) ------------------+
| 取号 025  桌号 A12  金额 ¥128.00                     |
| 状态流: CREATED -> IN_PROGRESS -> READY -> SERVED     |
| 当前: READY (预计上桌 2~3 分钟)                       |
| 商品: 查看全部 (折叠)                                 |
| 动作: [追加点餐] [呼叫服务]                           |
+-------------------------------------------------------+
```

## Uni-app: 6. Pickup (外带)
```
+------------- 我的取餐 --------------+
| 取号 026 状态: IN_PROGRESS          |
| 预计完成: 5 分钟                    |
| [刷新] [提醒加急] (条件显示)        |
+-------------------------------------+
```

---
## 统一命名规范
- serviceState 标签：CREATED / IN_PROGRESS / READY / SERVED / COMPLETED / CANCELED
- DineScene: DINE_IN / TAKEOUT
- 字段对齐：Order 表新增字段 (table_no, pickup_day, pickup_no)
- 聚合接口：/api/order/dine/detail 使用 items 聚合；后续可加 rootSummary。

## 后续迭代提示
1. 真正支付集成后 Payment 页添加支付结果轮询/回跳。
2. 添加 WebSocket 推送：状态/叫号实时更新（Queue Screen / User Status）。
3. 打印/厨房屏：Queue Screen 按角色权限只显示后厨动作按钮。
4. 追加点餐在前端复用 Menu 页并带 parentOrderId。
