import { Module } from '@nestjs/common';
import { RedisModule } from '../../src/redis/redis.module';
import { SmsService } from './sms.service';

@Module({
  imports: [RedisModule],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}