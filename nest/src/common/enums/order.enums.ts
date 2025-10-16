// Centralized order-related enums used across services
// DB codes (canonical):
// - OrderStatus: 0=PENDING, 1=CONFIRMED, 2=CANCELED, 3=COMPLETED
// - ShippingStatus: 0=PENDING, 1=SHIPPED, 2=PART_SHIPPED
// - PayStatus: 0=UNPAID, 1=PAID, 2=PAID (legacy prepay/other paid)

export enum OrderStatus {
  PENDING = 0,
  CONFIRMED = 1,
  CANCELED = 2,
  COMPLETED = 3,
}

export enum ShippingStatus {
  PENDING = 0,
  SHIPPED = 1,
  PART_SHIPPED = 2,
}

export enum PayStatus {
  UNPAID = 0,
  PAID = 1,
  PREPAID = 2, // treated as paid in display
}

// Helpers
export const isPaid = (s?: number | null) => Number(s) === PayStatus.PAID || Number(s) === PayStatus.PREPAID;
export const isCanceled = (s?: number | null) => Number(s) === OrderStatus.CANCELED;
export const isCompleted = (s?: number | null) => Number(s) === OrderStatus.COMPLETED;
export const isShipped = (s?: number | null) => Number(s) === ShippingStatus.SHIPPED || Number(s) === ShippingStatus.PART_SHIPPED;

