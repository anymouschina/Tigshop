// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminJwtAuthGuard extends AuthGuard('admin-jwt') {
  constructor(private readonly prismaService: PrismaService) {
    super();
  }

  handleRequest(err, user, info, context) {
    const request = context.switchToHttp().getRequest();

    // 将 PrismaService 添加到 request 中，供 AuthorityGuard 使用
    request.prisma = this.prismaService;

    return super.handleRequest(err, user, info, context);
  }
}