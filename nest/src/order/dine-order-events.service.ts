// @ts-nocheck
import { Injectable, Logger, Optional } from "@nestjs/common";
import { ImGateway } from "../im/im.gateway";

export type DineEventKind =
  | "CREATE"
  | "APPEND"
  | "CHANGE_TABLE"
  | "STATE_CHANGE"
  | "PAY"
  | "CANCEL";

export interface DineOrderEventPayload {
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
  extra?: any;
}

@Injectable()
export class DineOrderEventsService {
  private readonly logger = new Logger(DineOrderEventsService.name);
  constructor(@Optional() private gateway?: ImGateway) {}

  emit(ev: DineOrderEventPayload) {
    try {
      ev.ts = ev.ts || Date.now();
      const gw = (ImGateway.instance || this.gateway) as ImGateway | undefined;
      if (!gw || typeof (gw as any).pushDineEvent !== "function") {
        // 允许在无网关场景静默
        return;
      }
      (gw as any).pushDineEvent(ev);
    } catch (e) {
      this.logger.warn(
        `emit dine event failed kind=${ev?.kind} orderId=${ev?.orderId}: ${(e as any)?.message}`,
      );
    }
  }
}
