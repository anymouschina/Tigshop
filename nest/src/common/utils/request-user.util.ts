import { BadRequestException } from "@nestjs/common";

/**
 * Extracts the numeric user id from a Nest request object.
 * Supports multiple payload shapes coming from JWT compatibility layers.
 */
export function resolveRequestUserId(req: any): number {
  const source = req?.user ?? req ?? {};
  const candidate =
    source.userId ??
    source.user_id ??
    source.id ??
    source.uid ??
    source.sub ??
    source.appId ??
    (typeof source === "number" ? source : undefined);

  if (candidate === undefined || candidate === null) {
    throw new BadRequestException("用户未登录或Token无效");
  }

  const userId = Number(candidate);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new BadRequestException("用户信息异常，请重新登录");
  }

  return userId;
}
