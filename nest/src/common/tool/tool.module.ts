// @ts-nocheck
import { Module } from '@nestjs/common';
import { ToolController } from './tool.controller';
import { ToolService } from './tool.service';
import { PrismaModule } from '../../common/services/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ToolController],
  providers: [ToolService],
  exports: [ToolService],
})
export class ToolModule {}
