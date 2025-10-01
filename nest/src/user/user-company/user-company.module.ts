// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserCompanyService } from "./user-company.service";
import { UserCompanyController } from "./user-company.controller";
import { UserCompanyApiCompatController } from "./user-company.api-compat.controller";

@Module({
  controllers: [UserCompanyController, UserCompanyApiCompatController],
  providers: [UserCompanyService],
  exports: [UserCompanyService],
})
export class UserCompanyModule {}
