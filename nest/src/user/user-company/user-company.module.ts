import { Module } from '@nestjs/common';
import { UserCompanyService } from './user-company.service';
import { UserCompanyController } from './user-company.controller';
import { PrismaService } from '../../../database/prisma.service';

@Module({
  controllers: [UserCompanyController],
  providers: [UserCompanyService, PrismaService],
  exports: [UserCompanyService],
})
export class UserCompanyModule {}