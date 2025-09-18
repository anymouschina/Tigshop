import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AddressModule } from './address/address.module';
import { FavoriteModule } from './favorite/favorite.module';

@Module({
  imports: [DatabaseModule, AuthModule, AddressModule, FavoriteModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
