// @ts-nocheck
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ApiResponse } from "../interfaces/response.interface";
import { camelCase } from "../utils/camel-case.util";

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  // 将 *_time 的时间戳统一格式化为 'YYYY-MM-DD HH:mm:ss'
  private formatEpochToDateTime(v: any): any {
    if (v == null) return v;
    if (typeof v === "number") {
      if (v === 0) return "";
      const ms = v < 1e12 ? v * 1000 : v;
      const d = new Date(ms);
      const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
      const YYYY = d.getFullYear();
      const MM = pad(d.getMonth() + 1);
      const DD = pad(d.getDate());
      const hh = pad(d.getHours());
      const mm = pad(d.getMinutes());
      const ss = pad(d.getSeconds());
      return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
    }
    // 如果是字符串但为纯数字，也尝试处理
    if (typeof v === "string" && /^\d+$/.test(v)) {
      const num = Number(v);
      if (num > 0) return this.formatEpochToDateTime(num);
      return "";
    }
    return v;
  }

  private transformAdminTimeFields(payload: any): any {
    if (!payload || typeof payload !== "object") return payload;
    if (Array.isArray(payload)) return payload.map((it) => this.transformAdminTimeFields(it));
    const out: any = Array.isArray(payload) ? [] : {};
    for (const key of Object.keys(payload)) {
      const val = (payload as any)[key];
      if (val && typeof val === "object") {
        out[key] = this.transformAdminTimeFields(val);
      } else {
        // 规则：snake_case 下划线结尾为 _time 的字段，或常见时间字段名
        const isTimeLike = /_time$/.test(key) || [
          "pay_time",
          "received_time",
          "create_time",
          "update_time",
          "refund_time",
          "ship_time",
          "done_time",
          "last_update_time",
          "sign_time",
          "check_time",
          "cancel_time",
          "audit_time",
          "withdraw_time",
          "settle_time",
          "apply_time",
          "start_time",
          "end_time",
        ].includes(key);
        out[key] = isTimeLike ? this.formatEpochToDateTime(val) : val;
      }
    }
    return out;
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const req = context.switchToHttp().getRequest();
    const url: string = req?.url || "";
    return next.handle().pipe(
      map((data) => {
        const isAdminApi = url.startsWith("/adminapi/");
        // 已包装的返回
        if (data && typeof data === "object" && "code" in data) {
          if (isAdminApi) {
            // 仅对 data 字段做驼峰转换，避免动到 code/message 等外层字段
            const payload = (data as any).data;
            if (payload && typeof payload === "object") {
              const transformed = this.transformAdminTimeFields(payload);
              return { ...(data as any), data: camelCase(transformed, false) } as any;
            }
          }
          return data as any;
        }

        // 未包装的返回
        const finalData = isAdminApi && data && typeof data === "object" ? camelCase(this.transformAdminTimeFields(data), false) : data;
        return {
          code: 0,
          data: finalData,
          message: "success",
        } as any;
      }),
    );
  }
}
