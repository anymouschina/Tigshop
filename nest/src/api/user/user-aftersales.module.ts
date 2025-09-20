import { Module } from '@nestjs/common';
import { UserAftersalesController } from './user-aftersales.controller';
import { UserAftersalesService } from './user-aftersales.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [UserAftersalesController],
  providers: [UserAftersalesService, PrismaService],
  exports: [UserAftersalesService],
})
export class UserAftersalesModule {}