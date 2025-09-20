import { Module } from '@nestjs/common';
import { AdminAccountController } from './admin-account.controller';
import { AdminAccountService } from './admin-account.service';
import { PrismaModule } from '../../common/services/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdminAccountController],
  providers: [AdminAccountService],
  exports: [AdminAccountService],
})
export class AdminAccountModule {}