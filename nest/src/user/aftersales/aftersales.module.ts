import { Module } from '@nestjs/common';
import { AftersalesController } from './aftersales.controller';
import { AftersalesService } from './aftersales.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [AftersalesController],
  providers: [AftersalesService, PrismaService],
  exports: [AftersalesService],
})
export class AftersalesModule {}