// @ts-nocheck
import { Module } from "@nestjs/common";
import { ExampleController } from "./example.controller";
import { ExampleService } from "./example.service";


@Module({
  imports: [],
  controllers: [ExampleController],
  providers: [ExampleService],
  exports: [ExampleService],
})
export class ExampleModule {}
