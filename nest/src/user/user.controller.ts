// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Request,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { UserService } from "./user.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Public } from "../auth/decorators/public.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import { RegisterType } from "../auth/dto/auth.dto";

@ApiTags("User Management")
@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 用户注册 - 对齐PHP版本 regist/registAct
   */
  @Post("regist/registAct")
  @Public()
  @ApiOperation({ summary: "用户注册" })
  async register(@Body() registerData: any) {
    // 转换前端camelCase字段为后端snake_case字段
    const convertedData = {
      regist_type: registerData.registType
        ? RegisterType[registerData.registType.toUpperCase()]
        : RegisterType.MOBILE,
      username: registerData.username,
      password: registerData.password,
      mobile: registerData.mobile,
      mobile_code: registerData.mobileCode,
      email: registerData.email,
      email_code: registerData.emailCode,
      nickname: registerData.nickname,
      avatar: registerData.avatar,
      referrer_user_id: registerData.referrerUserId,
      salesman_id: registerData.salesmanId,
    };

    return this.userService.register(convertedData);
  }

  /**
   * 发送注册邮件验证码 - 对齐PHP版本 regist/sendEmailCode
   */
  @Post("regist/sendEmailCode")
  @Public()
  @ApiOperation({ summary: "发送注册邮件验证码" })
  async sendRegisterEmailCode(@Body() body: { email: string }) {
    return this.userService.sendRegisterEmailCode(body.email);
  }

  /**
   * 获取当前用户信息 - 对齐PHP版本 detail
   */
  @Get("user/detail")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取当前用户信息" })
  async getUserDetail(@Request() req) {
    return this.userService.getUserDetail(req.user.user_id);
  }

  /**
   * 更新用户信息 - 对齐PHP版本 updateInformation
   */
  @Post("updateInformation")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "更新用户信息" })
  async updateInformation(@Request() req, @Body() updateData: any) {
    return this.userService.updateInformation(req.user.user_id, updateData);
  }

  /**
   * 修改密码 - 对齐PHP版本 modifyPassword
   */
  @Post("modifyPassword")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "修改密码" })
  async modifyPassword(
    @Request() req,
    @Body() passwordData: { oldPassword: string; newPassword: string },
  ) {
    return this.userService.modifyPassword(
      req.user.user_id,
      passwordData.oldPassword,
      passwordData.newPassword,
    );
  }

  /**
   * 修改手机号 - 对齐PHP版本 modifyMobile
   */
  @Post("modifyMobile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "修改手机号" })
  async modifyMobile(
    @Request() req,
    @Body() mobileData: { mobile: string; code: string },
  ) {
    return this.userService.modifyMobile(
      req.user.user_id,
      mobileData.mobile,
      mobileData.code,
    );
  }

  /**
   * 修改邮箱 - 对齐PHP版本 modifyEmail
   */
  @Post("modifyEmail")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "修改邮箱" })
  async modifyEmail(
    @Request() req,
    @Body() emailData: { email: string; code: string },
  ) {
    return this.userService.modifyEmail(
      req.user.user_id,
      emailData.email,
      emailData.code,
    );
  }

  /**
   * 获取用户中心数据 - 对齐PHP版本 memberCenter
   */
  @Get("memberCenter")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户中心数据" })
  async getMemberCenter(@Request() req) {
    return this.userService.getMemberCenter(req.user.user_id);
  }

  /**
   * 获取用户浏览历史 - 对齐PHP版本 historyProduct
   */
  @Get("historyProduct")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户浏览历史" })
  async getHistoryProduct(
    @Request() req,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    return this.userService.getHistoryProduct(req.user.user_id, page, limit);
  }

  /**
   * 删除浏览历史 - 对齐PHP版本 delHistoryProduct
   */
  @Post("delHistoryProduct")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "删除浏览历史" })
  async deleteHistoryProduct(
    @Request() req,
    @Body() body: { productIds: number[] },
  ) {
    return this.userService.deleteHistoryProduct(
      req.user.user_id,
      body.productIds,
    );
  }

  /**
   * 上传用户头像 - 对齐PHP版本 uploadImg
   */
  @Post("uploadImg")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "上传用户头像" })
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  async uploadAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.uploadAvatar(req.user.user_id, file);
  }

  /**
   * 修改头像 - 对齐PHP版本 modifyAvatar
   */
  @Post("user/modifyAvatar")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "修改头像" })
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  async modifyAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.modifyAvatar(req.user.user_id, file);
  }

  /**
   * 用户退出登录 - 对齐PHP版本 logout
   */
  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "用户退出登录" })
  async logout(@Request() req) {
    return this.userService.logout(req.user.user_id);
  }

  /**
   * 发送修改密码验证码 - 对齐PHP版本 sendMobileCodeByModifyPassword
   */
  @Post("sendMobileCodeByModifyPassword")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "发送修改密码验证码" })
  async sendPasswordChangeCode(
    @Request() req,
    @Body() body: { mobile: string },
  ) {
    return this.userService.sendPasswordChangeCode(
      req.user.user_id,
      body.mobile,
    );
  }

  /**
   * 验证修改密码验证码 - 对齐PHP版本 checkModifyPasswordMobileCode
   */
  @Post("checkModifyPasswordMobileCode")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "验证修改密码验证码" })
  async checkPasswordChangeCode(
    @Request() req,
    @Body() body: { mobile: string; code: string },
  ) {
    return this.userService.checkPasswordChangeCode(
      req.user.user_id,
      body.mobile,
      body.code,
    );
  }

  /**
   * 账户金额变动列表 - 对齐PHP版本 Account/list
   */
  @Get("account/list")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "账户金额变动列表" })
  async getBalanceLogList(
    @Request() req,
    @Query()
    query: {
      page?: number;
      size?: number;
      sort_field?: string;
      sort_order?: string;
    },
  ) {
    return this.userService.getBalanceLogList(req.user.user_id, query);
  }

  /**
   * 获取用户等级列表 - 对齐PHP版本 levelList
   */
  @Get("levelList")
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户等级列表" })
  async getLevelList() {
    return this.userService.getLevelList();
  }

  /**
   * 获取用户等级信息 - 对齐PHP版本 levelInfo
   */
  @Get("levelInfo")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户等级信息" })
  async getLevelInfo(@Query("rank_id") rankId: number) {
    return this.userService.getLevelInfo(rankId);
  }

  /**
   * 注销账户 - 对齐PHP版本 close
   */
  @Post("close")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "注销账户" })
  async closeAccount(@Request() req) {
    return this.userService.closeAccount(req.user.user_id);
  }

  /**
   * 获取用户OpenId - 对齐PHP版本 userOpenId
   */
  @Get("userOpenId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户OpenId" })
  async getUserOpenId(@Request() req) {
    return this.userService.getUserOpenId(req.user.user_id);
  }
}
