import { Module } from '@nestjs/common';
import { LogController } from './log/log.controller';

@Module({
  controllers: [LogController],
  providers: [],
})
export class CommonModule {}