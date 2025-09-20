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

@ApiTags("User Management")
@Controller("api")
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 用户注册 - 对齐PHP版本 user/regist/registAct
   */
  @Post("user/regist/registAct")
  @Public()
  @ApiOperation({ summary: "用户注册" })
  async register(@Body() registerData: any) {
    return this.userService.register(registerData);
  }

  /**
   * 发送注册邮件验证码 - 对齐PHP版本 user/regist/sendEmailCode
   */
  @Post("user/regist/sendEmailCode")
  @Public()
  @ApiOperation({ summary: "发送注册邮件验证码" })
  async sendRegisterEmailCode(@Body() body: { email: string }) {
    return this.userService.sendRegisterEmailCode(body.email);
  }

  /**
   * 获取当前用户信息 - 对齐PHP版本 user/user/detail
   */
  @Get("user/user/detail")
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取当前用户信息" })
  async getUserDetail(@Request() req) {
    return this.userService.getUserDetail(req.user.userId);
  }

  /**
   * 更新用户信息 - 对齐PHP版本 user/user/updateInformation
   */
  @Post("user/user/updateInformation")
  @ApiBearerAuth()
  @ApiOperation({ summary: "更新用户信息" })
  async updateInformation(@Request() req, @Body() updateData: any) {
    return this.userService.updateInformation(req.user.userId, updateData);
  }

  /**
   * 修改密码 - 对齐PHP版本 user/user/modifyPassword
   */
  @Post("user/user/modifyPassword")
  @ApiBearerAuth()
  @ApiOperation({ summary: "修改密码" })
  async modifyPassword(
    @Request() req,
    @Body() passwordData: { oldPassword: string; newPassword: string },
  ) {
    return this.userService.modifyPassword(
      req.user.userId,
      passwordData.oldPassword,
      passwordData.newPassword,
    );
  }

  /**
   * 修改手机号 - 对齐PHP版本 user/user/modifyMobile
   */
  @Post("user/user/modifyMobile")
  @ApiBearerAuth()
  @ApiOperation({ summary: "修改手机号" })
  async modifyMobile(
    @Request() req,
    @Body() mobileData: { mobile: string; code: string },
  ) {
    return this.userService.modifyMobile(
      req.user.userId,
      mobileData.mobile,
      mobileData.code,
    );
  }

  /**
   * 修改邮箱 - 对齐PHP版本 user/user/modifyEmail
   */
  @Post("user/user/modifyEmail")
  @ApiBearerAuth()
  @ApiOperation({ summary: "修改邮箱" })
  async modifyEmail(
    @Request() req,
    @Body() emailData: { email: string; code: string },
  ) {
    return this.userService.modifyEmail(
      req.user.userId,
      emailData.email,
      emailData.code,
    );
  }

  /**
   * 获取用户中心数据 - 对齐PHP版本 user/user/memberCenter
   */
  @Get("user/user/memberCenter")
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户中心数据" })
  async getMemberCenter(@Request() req) {
    return this.userService.getMemberCenter(req.user.userId);
  }

  /**
   * 获取用户浏览历史 - 对齐PHP版本 user/user/historyProduct
   */
  @Get("user/user/historyProduct")
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户浏览历史" })
  async getHistoryProduct(
    @Request() req,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    return this.userService.getHistoryProduct(req.user.userId, page, limit);
  }

  /**
   * 删除浏览历史 - 对齐PHP版本 user/user/delHistoryProduct
   */
  @Post("user/user/delHistoryProduct")
  @ApiBearerAuth()
  @ApiOperation({ summary: "删除浏览历史" })
  async deleteHistoryProduct(
    @Request() req,
    @Body() body: { productIds: number[] },
  ) {
    return this.userService.deleteHistoryProduct(
      req.user.userId,
      body.productIds,
    );
  }

  /**
   * 上传用户头像 - 对齐PHP版本 user/user/uploadImg
   */
  @Post("user/user/uploadImg")
  @ApiBearerAuth()
  @ApiOperation({ summary: "上传用户头像" })
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  async uploadAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.userService.uploadAvatar(req.user.userId, file);
  }

  /**
   * 修改头像 - 对齐PHP版本 user/user/modifyAvatar
   */
  @Post("user/user/modifyAvatar")
  @ApiBearerAuth()
  @ApiOperation({ summary: "修改头像" })
  async modifyAvatar(@Request() req, @Body() body: { avatar: string }) {
    return this.userService.modifyAvatar(req.user.userId, body.avatar);
  }

  /**
   * 用户退出登录 - 对齐PHP版本 user/user/logout
   */
  @Post("user/user/logout")
  @ApiBearerAuth()
  @ApiOperation({ summary: "用户退出登录" })
  async logout(@Request() req) {
    return this.userService.logout(req.user.userId);
  }

  /**
   * 发送修改密码验证码 - 对齐PHP版本 user/user/sendMobileCodeByModifyPassword
   */
  @Post("user/user/sendMobileCodeByModifyPassword")
  @ApiBearerAuth()
  @ApiOperation({ summary: "发送修改密码验证码" })
  async sendPasswordChangeCode(
    @Request() req,
    @Body() body: { mobile: string },
  ) {
    return this.userService.sendPasswordChangeCode(
      req.user.userId,
      body.mobile,
    );
  }

  /**
   * 验证修改密码验证码 - 对齐PHP版本 user/user/checkModifyPasswordMobileCode
   */
  @Post("user/user/checkModifyPasswordMobileCode")
  @ApiBearerAuth()
  @ApiOperation({ summary: "验证修改密码验证码" })
  async checkPasswordChangeCode(
    @Request() req,
    @Body() body: { mobile: string; code: string },
  ) {
    return this.userService.checkPasswordChangeCode(
      req.user.userId,
      body.mobile,
      body.code,
    );
  }

  /**
   * 账户金额变动列表 - 对齐PHP版本 user/Account/list
   */
  @Get("user/account/list")
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
    return this.userService.getBalanceLogList(req.user.userId, query);
  }

  /**
   * 获取用户等级列表 - 对齐PHP版本 user/user/levelList
   */
  @Get("user/user/levelList")
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户等级列表" })
  async getLevelList() {
    return this.userService.getLevelList();
  }

  /**
   * 获取用户等级信息 - 对齐PHP版本 user/user/levelInfo
   */
  @Get("user/user/levelInfo")
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户等级信息" })
  async getLevelInfo(@Query("rank_id") rankId: number) {
    return this.userService.getLevelInfo(rankId);
  }

  /**
   * 注销账户 - 对齐PHP版本 user/user/close
   */
  @Post("user/user/close")
  @ApiBearerAuth()
  @ApiOperation({ summary: "注销账户" })
  async closeAccount(@Request() req) {
    return this.userService.closeAccount(req.user.userId);
  }

  /**
   * 获取用户OpenId - 对齐PHP版本 user/user/userOpenId
   */
  @Get("user/user/userOpenId")
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户OpenId" })
  async getUserOpenId(@Request() req) {
    return this.userService.getUserOpenId(req.user.userId);
  }
}
