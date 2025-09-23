import { Module } from "@nestjs/common";
import { DecorateController } from "./decorate.controller";
import { UserDecorateController } from "./user-decorate.controller";
import { DecorateService } from "./decorate.service";
import { UserDecorateService } from "./user-decorate.service";

@Module({
  controllers: [DecorateController, UserDecorateController],
  providers: [DecorateService, UserDecorateService],
  exports: [DecorateService, UserDecorateService],
})
export class DecorateModule {}
