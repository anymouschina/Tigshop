// @ts-nocheck
import { Module } from '@nestjs/common';
import { UserCompanyController } from './user-company.controller';
import { UserCompanyService } from './user-company.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [UserCompanyController],
  providers: [UserCompanyService, PrismaService],
  exports: [UserCompanyService],
})
export class UserCompanyModule {}
