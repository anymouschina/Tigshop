import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR, APP_FILTER } from "@nestjs/core";
import { UserModule } from "./user/user.module";
import { ConfigModule } from "./config/config.module";
import { DatabaseModule } from "./database/database.module";
import { LoggerModule } from "./common/logger/logger.module";
import { ApiModule } from "./api/api.module";
import { UserCouponModule } from "./user/coupon/coupon.module";
import { LoginModule } from "./user/login/login.module";
import { AddressModule } from "./user/address/address.module";
import { UserCompanyModule } from "./user/user-company/user-company.module";
import { FeedbackModule } from "./user/feedback/feedback.module";
import { AuthModule } from "./auth/auth.module";
import { AdminModule } from "./admin/admin.module";
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
import { DecorateModule } from "./common/decorate/decorate.module";

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    LoggerModule,
    ScheduleModule.forRoot(),
    // Re-enabled module after fixing Prisma field names
    UserModule,
    UserCouponModule,
    LoginModule,
    AddressModule,
    UserCompanyModule,
    FeedbackModule,
    ApiModule,
    AuthModule,
    AdminModule,
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
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Temporarily disable global JWT guard for testing
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
})
export class AppModule {}
