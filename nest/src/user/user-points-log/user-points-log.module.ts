import { Module } from '@nestjs/common';
import { UserPointsLogService } from './user-points-log.service';
import { UserPointsLogController } from './user-points-log.controller';
import { PrismaService } from '../../../database/prisma.service';

@Module({
  controllers: [UserPointsLogController],
  providers: [UserPointsLogService, PrismaService],
  exports: [UserPointsLogService],
})
export class UserPointsLogModule {}