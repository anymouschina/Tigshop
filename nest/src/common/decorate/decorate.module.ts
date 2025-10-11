import { Module } from "@nestjs/common";
import { UserDecorateController } from "./user-decorate.controller";
import { DecorateService } from "./decorate.service";
import { UserDecorateService } from "./user-decorate.service";

@Module({
  controllers: [ UserDecorateController],
  providers: [DecorateService, UserDecorateService],
  exports: [DecorateService, UserDecorateService],
})
export class DecorateModule {}
