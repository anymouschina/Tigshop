// @ts-nocheck
import { Module } from '@nestjs/common';
import { ECardGroupController } from './ecard-group.controller';
import { ECardGroupService } from './ecard-group.service';
import { PrismaModule } from '../../common/services/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ECardGroupController],
  providers: [ECardGroupService],
  exports: [ECardGroupService],
})
export class ECardGroupModule {}
