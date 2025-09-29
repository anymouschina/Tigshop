import { Module } from "@nestjs/common";
import { AuthorityService } from "./authority.service";
import { AuthorityController } from "./authority.controller";
import { AdminUserController } from "./admin-user.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuthModule } from "../../auth/auth.module";
import { SuppliersCompatController } from "./suppliers.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AuthorityController, AdminUserController, SuppliersCompatController],
  providers: [AuthorityService],
  exports: [AuthorityService],
})
export class AuthorityModule {}
