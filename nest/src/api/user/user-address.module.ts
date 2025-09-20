// @ts-nocheck
import { Module } from '@nestjs/common';
import { UserAddressController } from './user-address.controller';
import { UserAddressService } from './user-address.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [UserAddressController],
  providers: [UserAddressService, PrismaService],
  exports: [UserAddressService],
})
export class UserAddressModule {}
