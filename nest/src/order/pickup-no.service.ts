// @ts-nocheck
import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PickupNoService {
  constructor(private readonly redis: RedisService) {}

  async next(shopId: number) {
    const dayStr = dayjs().format('YYYYMMDD');
    const key = `pickup_no:${shopId}:${dayStr}`;
    const no = await this.redis.increment(key, 1, { keyPrefix: '' });
    if (no === 1) {
      await this.redis.expire(key, 60 * 60 * 26, { keyPrefix: '' });
    }
    return { day: Number(dayStr), no };
  }
}
