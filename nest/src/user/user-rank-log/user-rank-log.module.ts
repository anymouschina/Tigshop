// @ts-nocheck
import { Module } from '@nestjs/common';
import { UserRankLogController } from './user-rank-log.controller';
import { UserRankLogService } from './user-rank-log.service';
import { PrismaModule } from '../../common/services/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserRankLogController],
  providers: [UserRankLogService],
  exports: [UserRankLogService],
})
export class UserRankLogModule {}
