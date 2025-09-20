// @ts-nocheck
import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { PrismaModule } from '../../common/services/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
