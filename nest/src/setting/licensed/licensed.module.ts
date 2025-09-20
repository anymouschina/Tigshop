// @ts-nocheck
import { Module } from "@nestjs/common";
import { LicensedService } from "./licensed.service";
import { LicensedController } from "./licensed.controller";
import { DatabaseModule } from "../../database/database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [LicensedController],
  providers: [LicensedService],
  exports: [LicensedService],
})
export class LicensedModule {}
