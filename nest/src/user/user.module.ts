// @ts-nocheck
import { Module, MiddlewareConsumer } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { AuthModule } from "../auth/auth.module";
import { AddressModule } from "./address/address.module";
import { FavoriteModule } from "./favorite/favorite.module";
import { UserCompanyModule } from "./user-company/user-company.module";
import { UserRankModule } from "./user-rank/user-rank.module";
import { UserPointsLogModule } from "./user-points-log/user-points-log.module";
import { UserMessageLogModule } from "./user-message-log/user-message-log.module";
import { UserMessageModule } from "./user-message/user-message.module";
import { UserAuthModule } from "./auth/auth.module";
import { CollectModule } from "./collect/collect.module";
import { UserCouponModule } from "./coupon/coupon.module";
import { UserHistoryModule } from "./history/history.module";
import { UploadModule } from "../upload/upload.module";
import { AuthDebugMiddleware } from "../auth/middlewares/auth-debug.middleware";

@Module({
  imports: [
    AuthModule,
    AddressModule,
    FavoriteModule,
    UserCompanyModule,
    UserRankModule,
    UserPointsLogModule,
    UserMessageLogModule,
    UserMessageModule,
    UserAuthModule,
    CollectModule,
    UserCouponModule,
    UserHistoryModule,
    UploadModule,
  ],
  controllers: [UserController],
  providers: [UserService, AuthDebugMiddleware],
  exports: [
    UserService,
    UserCompanyModule,
    UserRankModule,
    UserPointsLogModule,
    UserMessageLogModule,
    UserMessageModule,
  ],
})
export class UserModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthDebugMiddleware)
      .forRoutes('user');
  }
}
