import { Injectable, NestMiddleware } from "@nestjs/common";

/**
 * 将 body/query 中的 userFrom 提取到 req.userFrom，并在 body 中删除，
 * 以避免全局 ValidationPipe 在 forbidNonWhitelisted=true 时抛出
 * “property userFrom should not exist”。
 */
@Injectable()
export class UserFromExtractMiddleware implements NestMiddleware {
  use(req: any, _res: any, next: () => void) {
    try {
      if (
        req &&
        req.body &&
        typeof req.body === "object" &&
        "userFrom" in req.body
      ) {
        if (req.userFrom === undefined) req.userFrom = req.body.userFrom;
        // 从 body 移除，避免 DTO 校验失败
        delete req.body.userFrom;
      }
      if (
        req &&
        req.query &&
        typeof req.query === "object" &&
        "userFrom" in req.query
      ) {
        if (req.userFrom === undefined) req.userFrom = req.query.userFrom;
        // 之前为了方便保留，但由于很多 Query DTO 同样使用 whitelist + forbidNonWhitelisted
        // 会导致报错 “property userFrom should not exist”，因此这里同样移除
        delete req.query.userFrom;
      }
    } catch (_) {}
    next();
  }
}
