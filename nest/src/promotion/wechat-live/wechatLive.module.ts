import { Module } from '@nestjs/common';
import { WechatLiveService } from './wechatLive.service';
import { WechatLiveController } from './wechatLive.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [WechatLiveController],
  providers: [WechatLiveService],
  exports: [WechatLiveService],
})
export class WechatLiveModule {}
