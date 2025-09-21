// @ts-nocheck
import { Module } from "@nestjs/common";
import { LicensedService } from "./licensed.service";
import { LicensedController } from "./licensed.controller";

@Module({
  imports: [],
  controllers: [LicensedController],
  providers: [LicensedService],
  exports: [LicensedService],
})
export class LicensedModule {}
