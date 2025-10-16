import { Module } from "@nestjs/common";
import { AuthorityService } from "./authority.service";
import { AuthorityController } from "./authority.controller";
import { AdminUserController } from "./admin-user.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuthModule } from "../../auth/auth.module";
import { SuppliersCompatController } from "./suppliers.controller";
import { AdminRoleService } from "../admin-role/admin-role.service";
import { AdminRoleCompatController } from "./admin-role-compat.controller";
import { AuthorityCompatController } from "./authority-compat.controller";
import { AdminLogCompatController } from "./admin-log-compat.controller";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    AuthorityController,
    AdminUserController,
    SuppliersCompatController,
    AdminRoleCompatController,
    AuthorityCompatController,
    AdminLogCompatController,
  ],
  providers: [AuthorityService, AdminRoleService],
  exports: [AuthorityService],
})
export class AuthorityModule {}
