import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { UserModule } from './user/user.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { LoggerModule } from './common/logger/logger.module';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
import { CouponModule } from './coupon/coupon.module';
import { PromotionModule } from './promotion/promotion.module';
import { PanelModule } from './panel/panel.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
// import { UploadModule } from './upload/upload.module';
// import { NotificationModule } from './notification/notification.module';
// import { AppointmentModule } from './appointment/appointment.module';
// import { MicroservicesModule } from './microservices/microservices.module';
// import { WechatModule } from './wechat/wechat.module';
// import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    LoggerModule,
    ScheduleModule.forRoot(),
    AuthModule,
    AdminModule,
    UserModule,
    ProductModule,
    CartModule,
    OrderModule,
    PaymentModule,
    CouponModule,
    PromotionModule,
    PanelModule,
    // UploadModule,
    // NotificationModule,
    // AppointmentModule,
    // MicroservicesModule,
    // WechatModule,
    // RedisModule,
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
