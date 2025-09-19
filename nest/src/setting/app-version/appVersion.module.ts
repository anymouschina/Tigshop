import { Module } from '@nestjs/common';
import { AppVersionService } from './appVersion.service';
import { AppVersionController } from './appVersion.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AppVersionController],
  providers: [AppVersionService],
  exports: [AppVersionService],
})
export class AppVersionModule {}
