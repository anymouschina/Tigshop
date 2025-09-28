// @ts-nocheck
import { Injectable, NestMiddleware } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class PrismaMiddleware implements NestMiddleware {
  constructor(private readonly prismaService: PrismaService) {}

  use(req: any, res: any, next: (error?: any) => void) {
    // 将 PrismaService 实例添加到 request 对象中
    req.prisma = this.prismaService;
    next();
  }
}
