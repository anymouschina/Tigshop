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
import { UploadModule } from "../upload/upload.module";
import { CommentModule as UserCommentModule } from "./comment/comment.module"; // 用户评论模块（提供 /api/user/comment/* 兼容路由）
import { AuthDebugMiddleware } from "../auth/middlewares/auth-debug.middleware";
import { AdminUserPointsLogCompatController } from "./admin-user-points-log-compat.controller";
import { AdminFeedbackCompatController } from "./admin-feedback-compat.controller";
import { AdminUserMessageLogCompatController } from "./admin-user-message-log-compat.controller";
import { AdminUserRankCompatController } from "./admin-user-rank-compat.controller";
import { AdminUserRankLogCompatController } from "./admin-user-rank-log-compat.controller";
import { AdminUserCompanyCompatController } from "./admin-user-company-compat.controller";

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
    UploadModule,
    UserCommentModule, // 注册用户评论相关路由
  ],
  controllers: [
    UserController,
    AdminUserPointsLogCompatController,
    AdminFeedbackCompatController,
    AdminUserMessageLogCompatController,
    AdminUserRankCompatController,
    AdminUserRankLogCompatController,
    AdminUserCompanyCompatController,
  ],
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
    consumer.apply(AuthDebugMiddleware).forRoutes("user");
  }
}
