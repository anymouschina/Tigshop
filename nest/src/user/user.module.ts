import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AddressModule } from './address/address.module';
import { FavoriteModule } from './favorite/favorite.module';
import { UserCompanyModule } from './user-company/user-company.module';
import { UserRankModule } from './user-rank/user-rank.module';
import { UserPointsLogModule } from './user-points-log/user-points-log.module';
import { UserMessageLogModule } from './user-message-log/user-message-log.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AddressModule,
    FavoriteModule,
    UserCompanyModule,
    UserRankModule,
    UserPointsLogModule,
    UserMessageLogModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [
    UserService,
    UserCompanyModule,
    UserRankModule,
    UserPointsLogModule,
    UserMessageLogModule,
  ],
})
export class UserModule {}
