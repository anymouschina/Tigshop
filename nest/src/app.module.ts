import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR, APP_FILTER } from "@nestjs/core";
import { MulterModule } from "@nestjs/platform-express";
import { UserModule } from "src/user/user.module";
import { ConfigModule } from "./config/config.module";
import { LoggerModule } from "./common/logger/logger.module";
// import { ApiModule } from "./api/api.module";
import { UserCouponModule } from "./user/coupon/coupon.module";
import { LoginModule } from "./user/login/login.module";
import { AddressModule } from "./user/address/address.module";
import { UserCompanyModule } from "./user/user-company/user-company.module";
import { FeedbackModule } from "./user/feedback/feedback.module";
import { AuthModule } from "./auth/auth.module";
import { AdminModule } from "./admin/admin.module";
import { MerchantModule } from "./merchant/merchant.module";
import { ProductModule } from "./product/product.module";
import { CartModule } from "./cart/cart.module";
import { OrderModule } from "./order/order.module";
import { PaymentModule } from "./payment/payment.module";
import { CouponModule } from "./coupon/coupon.module";
import { PromotionModule } from "./promotion/promotion.module";
import { PanelModule } from "./panel/panel.module";
import { MsgModule } from "./msg/msg.module";
import { SettingModule } from "./setting/setting.module";
import { FinanceModule } from "./finance/finance.module";
import { ContentModule } from "./content/content.module";
import { UploadModule } from "./upload/upload.module";
import { NotificationModule } from "./notification/notification.module";
import { AppointmentModule } from "./appointment/appointment.module";
import { WechatModule } from "./wechat/wechat.module";
import { RedisModule } from "./redis/redis.module";
import { ScheduleModule } from "@nestjs/schedule";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { MicroservicesModule } from "./microservices/microservices.module";
import { SmsModule } from "../common/sms/sms.module";
import { EmailModule } from "../common/email/email.module";
import { CommonModule } from "./common/common.module";
import { AdminRolesGuard } from "./auth/guards/admin-roles.guard";
import { AuthorityGuard } from "./auth/guards/authority.guard";
import { HomeModule } from "./home/home.module";
import { VerificationModule } from "./common/verification/verification.module";
import { CsrfModule } from "./common/csrf/csrf.module";
import { PrismaModule } from "./prisma/prisma.module";
import { DecorateModule } from "./common/decorate/decorate.module";
import { StatisticsModule } from "./statistics/statistics.module";
import { AppController } from "./app.contronller";
import { AdminUserCompatController } from "./admin/authority/admin-user-compat.controller";
import { DecorateDiscreteCompatController } from "./decorate/decorate-discrete-compat.controller";
import { MerchantApplyCompatController } from "./merchant/merchant-apply-compat.controller";
import { MerchantCompatController } from "./merchant/merchant-compat.controller";
import { TranslationsModule } from "./lang/translations/translations.module";
import { PrintModule } from "./print/print.module";
import { AdminOrderConfigCompatController } from "./order/admin-order-config-compat.controller";
import { AdminECardGroupCompatController } from "./product/admin-ecard-group-compat.controller";
import { AdminMobileCatNavCompatController } from "./decorate/admin-mobile-cat-nav-compat.controller";
import { AdminDecorateCompatController } from "./decorate/admin-decorate-compat.controller";
import { AdminDecorateShareCompatController } from "./decorate/admin-decorate-share-compat.controller";
import { AdminDecorateRequestCompatController } from "./decorate/admin-decorate-request-compat.controller";
import { AdminPcNavigationCompatController } from "./decorate/admin-pc-navigation-compat.controller";
import { AdminPcCatFloorCompatController } from "./decorate/admin-pc-cat-floor-compat.controller";
import { AdminSalesmanConfigCompatController } from "./salesman/admin-salesman-config-compat.controller";
import { AdminSalesmanOverviewCompatController } from "./salesman/admin-salesman-overview-compat.controller";
import { AdminSalesmanProductCompatController } from "./salesman/admin-salesman-product-compat.controller";
import { AdminSalesmanMaterialCategoryCompatController } from "./salesman/admin-salesman-material-category-compat.controller";
import { AdminSalesmanMaterialCompatController } from "./salesman/admin-salesman-material-compat.controller";

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    LoggerModule,
    MulterModule.register(),
    ScheduleModule.forRoot(),
    // Re-enabled module after fixing Prisma field names
    UserModule,
    UserCouponModule,
    LoginModule,
    AddressModule,
    UserCompanyModule,
    FeedbackModule,
    // ApiModule,
    AuthModule,
    AdminModule,
    MerchantModule,
    ProductModule,
    CartModule,
    OrderModule,
    PaymentModule,
    CouponModule,
    PromotionModule,
    PanelModule,
    MsgModule,
    SettingModule,
    FinanceModule,
    ContentModule,
    UploadModule,
    NotificationModule,
    AppointmentModule,
    MicroservicesModule, // microservices
    WechatModule,
    RedisModule,
    SmsModule,
    EmailModule,
    DecorateModule,
    CommonModule,
    HomeModule,
    VerificationModule,
    CsrfModule,
    StatisticsModule,
    TranslationsModule,
    PrintModule,
  ],
  controllers: [
    AppController,
    AdminUserCompatController,
    DecorateDiscreteCompatController,
    MerchantApplyCompatController,
    MerchantCompatController,
    AdminOrderConfigCompatController,
    AdminECardGroupCompatController,
    AdminMobileCatNavCompatController,
    AdminDecorateCompatController,
    AdminDecorateShareCompatController,
    AdminDecorateRequestCompatController,
    AdminPcNavigationCompatController,
    AdminPcCatFloorCompatController,
    AdminSalesmanConfigCompatController,
    AdminSalesmanOverviewCompatController,
    AdminSalesmanProductCompatController,
    AdminSalesmanMaterialCategoryCompatController,
    AdminSalesmanMaterialCompatController,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    AdminRolesGuard,
    AuthorityGuard,
  ],
})
export class AppModule {}
