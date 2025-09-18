import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { DatabaseService } from 'src/database/database.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [NotificationController],
  providers: [NotificationService, DatabaseService],
  exports: [NotificationService],
})
export class NotificationModule {}