// @ts-nocheck
// Shared helpers to compute order status display names consistently
import { OrderStatus, ShippingStatus, PayStatus } from "./enums/order.enums";

export function getOrderStatusNameDisplay(
  orderStatus: number,
  shippingStatus?: number,
  commentStatus?: number,
  payStatus?: number,
): string {
  const s = Number(orderStatus);
  const ship = Number(shippingStatus);
  const pay = Number(payStatus);
  if (s === OrderStatus.PENDING) {
    // 待支付/待确认；如果已支付但状态未推进，按发/未发货显示
    if (pay === PayStatus.PAID || pay === PayStatus.PREPAID)
      return ship > 0 ? "待收货" : "待发货";
    return "待支付";
  }
  if (s === OrderStatus.CONFIRMED) {
    // 已确认：根据发货进度展示
    return ship > 0 ? "待收货" : "待发货";
  }
  if (s === OrderStatus.CANCELED) {
    // 已取消
    return "已取消";
  }
  if (s === OrderStatus.COMPLETED) {
    // 已完成：未评价显示待评价
    return Number(commentStatus) === 0 ? "待评价" : "已完成";
  }
  return "";
}

export function getShippingStatusNameDisplay(status: number): string {
  switch (Number(status)) {
    case ShippingStatus.PENDING:
      return "待发货";
    case ShippingStatus.SHIPPED:
      return "已发货";
    case ShippingStatus.PART_SHIPPED:
      return "部分发货";
    default:
      return "";
  }
}

export function getPayStatusNameDisplay(status: number): string {
  switch (Number(status)) {
    case PayStatus.UNPAID:
      return "待支付";
    case PayStatus.PAID:
    case PayStatus.PREPAID: // 与历史行为兼容：2 也显示已支付
      return "已支付";
    default:
      return "";
  }
}
