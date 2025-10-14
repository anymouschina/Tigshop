export interface DineQueueRecord {
  orderId: number;
  pickupNo: number;
  tableNo?: string | null;
  orderType: number; // 2 dine-in 3 takeout
  serviceState: string;
}

export type DineEventKind = 'CREATE'|'APPEND'|'CHANGE_TABLE'|'STATE_CHANGE'|'PAY'|'CANCEL';

export interface DineOrderEvent {
  kind: DineEventKind;
  orderId: number;
  rootOrderId?: number;
  parentOrderId?: number;
  shopId: number;
  userId: number;
  serviceState?: string;
  dineScene?: string;
  tableNo?: string | null;
  pickupNo?: number | null;
  orderType?: number;
  amount?: number;
  ts?: number;
}
