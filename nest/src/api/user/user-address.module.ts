// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserAddressController } from "./user-address.controller";
import { UserAddressService } from "./user-address.service";

@Module({
  controllers: [UserAddressController],
  providers: [UserAddressService],
  exports: [UserAddressService],
})
export class UserAddressModule {}
