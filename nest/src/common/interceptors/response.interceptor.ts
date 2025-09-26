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

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // 如果返回的数据已经是PHP格式（包含code字段），直接返回
        if (data && typeof data === 'object' && 'code' in data) {
          return data;
        }

        // 否则包装成标准格式（移除timestamp以匹配PHP版本）
        return {
          code: 0,
          data,
          message: "success",
        };
      }),
    );
  }
}
