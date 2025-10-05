import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { APP_INTERCEPTOR, APP_FILTER } from "@nestjs/core";
import { MulterModule } from "@nestjs/platform-express";
import { UserModule } from "src/user/user.module";
import { ConfigModule } from "./config/config.module";
import { LoggerModule } from "./common/logger/logger.module";
import { UserCouponModule } from "./user/coupon/coupon.module";
import { LoginModule } from "./user/login/login.module";
import { AddressModule } from "./user/address/address.module";
import { UserCompanyModule } from "./user/user-company/user-company.module";
import { UserAftersalesModule } from "./user/aftersales/user-aftersales.module";
import { UserAuthModule } from "./user/auth/auth.module";
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
import { UserOrderInvoiceModule } from "./finance/order-invoice/user-order-invoice.module";
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
import { AdminECardCompatController } from "./product/admin-ecard-compat.controller";
import { AdminMobileCatNavCompatController } from "./decorate/admin-mobile-cat-nav-compat.controller";
import { AdminDecorateCompatController } from "./decorate/admin-decorate-compat.controller";
import { AdminDecorateShareCompatController } from "./decorate/admin-decorate-share-compat.controller";
import { AdminDecorateRequestCompatController } from "./decorate/admin-decorate-request-compat.controller";
import { AdminPcNavigationCompatController } from "./decorate/admin-pc-navigation-compat.controller";
import { AdminMobileDecorateCompatController } from "./decorate/admin-mobile-decorate-compat.controller";
import { AdminPcCatFloorCompatController } from "./decorate/admin-pc-cat-floor-compat.controller";
import { AdminMemberCompatController } from "./user/admin-user-compat.controller";
import { AdminSalesmanConfigCompatController } from "./salesman/admin-salesman-config-compat.controller";
import { AdminSalesmanOverviewCompatController } from "./salesman/admin-salesman-overview-compat.controller";
import { AdminSalesmanProductCompatController } from "./salesman/admin-salesman-product-compat.controller";
import { AdminSalesmanMaterialCategoryCompatController } from "./salesman/admin-salesman-material-category-compat.controller";
import { AdminSalesmanMaterialCompatController } from "./salesman/admin-salesman-material-compat.controller";
import { AdminSalesmanGroupCompatController } from "./salesman/admin-salesman-group-compat.controller";
import { AdminSalesmanCompatController } from "./salesman/admin-salesman-compat.controller";
import { AdminSalesmanContentCompatController } from "./salesman/admin-salesman-content-compat.controller";
import { AdminSalesmanOrderCompatController } from "./salesman/admin-salesman-order-compat.controller";
import { AdminSalesmanCustomerTransactionCompatController } from "./salesman/admin-salesman-customer-transaction-compat.controller";
import { AdminArticleCompatController } from "./content/admin-article-compat.controller";
import { AdminArticleCategoryCompatController } from "./content/admin-article-category-compat.controller";
import { AdminShopAccountCompatController } from "./merchant/admin-shop-account-compat.controller";
import { AdminShopWithdrawCompatController } from "./merchant/admin-shop-withdraw-compat.controller";
import { AdminVendorWithdrawCompatController } from "./vendor/admin-vendor-withdraw-compat.controller";
import { AdminLocalesCompatController } from "./lang/admin-locales-compat.controller";
import { AdminLocalesRelationCompatController } from "./lang/admin-locales-relation-compat.controller";
import { AdminCurrencyCompatController } from "./lang/admin-currency-compat.controller";
import { AdminAreaCodeCompatController } from "./setting/area-code/admin-area-code-compat.controller";
import { SalesmanDetailController } from "./salesman/salesman-detail.controller";
import { SearchGuessController } from "./search/search-guess.controller";
import { SearchController } from "./search/search.controller";
import { SearchService } from "./search/search.service";
import { AppVersionController } from "./app-version/app-version.controller";
import { CategoryModule } from "./category/category.module";
import { ImModule } from "./im/im.module";
import { CaseTransformMiddleware } from "./common/middleware/case-transform.middleware";
import { RequestSourceMiddleware } from "./common/middleware/request-source.middleware";
import { UserFromExtractMiddleware } from "./common/middleware/user-from-extract.middleware";

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
  UserAftersalesModule,
    FeedbackModule,
  UserAuthModule,
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
  UserOrderInvoiceModule,
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
    CategoryModule,
  ImModule,
  ],
  controllers: [
    AppController,
    // Public user-side compat controllers
    SearchGuessController,
    // Search apis (getFilter/getProduct)
    SearchController,
  AppVersionController,
    AdminUserCompatController,
    DecorateDiscreteCompatController,
    MerchantApplyCompatController,
    MerchantCompatController,
    AdminOrderConfigCompatController,
  AdminECardGroupCompatController,
  AdminECardCompatController,
    AdminMobileCatNavCompatController,
    AdminDecorateCompatController,
    AdminDecorateShareCompatController,
    AdminDecorateRequestCompatController,
    AdminPcNavigationCompatController,
    AdminPcCatFloorCompatController,
  AdminMobileDecorateCompatController,
    AdminMemberCompatController,
    AdminSalesmanConfigCompatController,
    AdminSalesmanOverviewCompatController,
    AdminSalesmanProductCompatController,
    AdminSalesmanMaterialCategoryCompatController,
    AdminSalesmanMaterialCompatController,
    AdminSalesmanGroupCompatController,
    AdminSalesmanCompatController,
    AdminSalesmanContentCompatController,
    AdminSalesmanOrderCompatController,
    AdminSalesmanCustomerTransactionCompatController,
    AdminArticleCompatController,
    AdminArticleCategoryCompatController,
    AdminShopAccountCompatController,
    AdminShopWithdrawCompatController,
    AdminVendorWithdrawCompatController,
    AdminLocalesCompatController,
    AdminLocalesRelationCompatController,
    AdminCurrencyCompatController,
    AdminAreaCodeCompatController,
    // Front salesman detail
    SalesmanDetailController,
    
    
    
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
    // Search service provider
    SearchService,
    AdminRolesGuard,
    AuthorityGuard,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Detect request source first, then normalize keys
    consumer
      .apply(
        RequestSourceMiddleware, // 识别来源
        UserFromExtractMiddleware, // 提前剥离 userFrom，避免被 DTO 校验拦截
        CaseTransformMiddleware, // 键名格式转换
      )
      .forRoutes('*');
  }
}
