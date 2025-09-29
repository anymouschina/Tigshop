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
              return { ...(data as any), data: camelCase(payload, false) } as any;
            }
          }
          return data as any;
        }

        // 未包装的返回
        const finalData = isAdminApi && data && typeof data === "object" ? camelCase(data, false) : data;
        return {
          code: 0,
          data: finalData,
          message: "success",
        } as any;
      }),
    );
  }
}
