// @ts-nocheck
import { Module } from "@nestjs/common";
import { UserLoginController } from "./user-login.controller";
import { UserLoginService } from "./user-login.service";
import { PrismaService } from "../../prisma.service";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<string>("JWT_EXPIRES_IN", "7d"),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserLoginController],
  providers: [UserLoginService, PrismaService],
  exports: [UserLoginService],
})
export class UserLoginModule {}
