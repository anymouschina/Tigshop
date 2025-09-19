import { Module } from '@nestjs/common';
import { CollectService } from './collect.service';
import { CollectController } from './collect.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CollectController],
  providers: [CollectService],
  exports: [CollectService],
})
export class CollectModule {}