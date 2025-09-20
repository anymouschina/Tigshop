// @ts-nocheck
import { Module } from '@nestjs/common';
import { ExampleController } from './example.controller';
import { ExampleService } from './example.service';
import { PrismaModule } from '../../common/services/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExampleController],
  providers: [ExampleService],
  exports: [ExampleService],
})
export class ExampleModule {}
