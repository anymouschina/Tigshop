import { Module } from '@nestjs/common';
import { MicroservicesController } from './microservices.controller';
import { MicroservicesService } from './microservices.service';

@Module({
  controllers: [MicroservicesController],
  providers: [MicroservicesService],
  exports: [MicroservicesService],
})
export class MicroservicesModule {}