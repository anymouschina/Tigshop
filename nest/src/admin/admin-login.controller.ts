// @ts-nocheck
import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { AdminLoginDto } from "./dto/admin.dto";
import { Public } from "../auth/decorators/public.decorator";

@ApiTags("Admin API - 登录")
@Controller("adminapi/login")
export class AdminLoginController {
  constructor(private readonly adminService: AdminService) {}

  @Public()
  @Post("signin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "管理员登录" })
  async signin(@Body() loginDto: AdminLoginDto) {
    const data = await this.adminService.login(loginDto);

    return {
      code: 0,
      message: "success",
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
