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
@Controller("api/user")
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

  // 兼容 PHP: /api/user/user/updateInformation
  @Post("user/updateInformation")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "更新用户信息（兼容路径）" })
  async updateInformationAlias(@Request() req, @Body() updateData: any) {
    return this.updateInformation(req, updateData);
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

  // 兼容 PHP: /api/user/user/modifyPassword
  @Post("user/modifyPassword")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "修改密码（兼容路径）" })
  async modifyPasswordAlias(
    @Request() req,
    @Body() passwordData: { oldPassword: string; newPassword: string },
  ) {
    return this.modifyPassword(req, passwordData);
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

  // 兼容 PHP: /api/user/user/modifyMobile
  @Post("user/modifyMobile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "修改手机号（兼容路径）" })
  async modifyMobileAlias(
    @Request() req,
    @Body() mobileData: { mobile: string; code: string },
  ) {
    return this.modifyMobile(req, mobileData);
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

  // 兼容 PHP: /api/user/user/modifyEmail
  @Post("user/modifyEmail")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "修改邮箱（兼容路径）" })
  async modifyEmailAlias(
    @Request() req,
    @Body() emailData: { email: string; code: string },
  ) {
    return this.modifyEmail(req, emailData);
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

  // 兼容 PHP: /api/user/user/memberCenter
  @Get("user/memberCenter")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户中心数据（兼容路径）" })
  async getMemberCenterAlias(@Request() req) {
    return this.getMemberCenter(req);
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

  // 兼容 PHP: /api/user/user/historyProduct
  @Get("user/historyProduct")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户浏览历史（兼容路径）" })
  async getHistoryProductAlias(
    @Request() req,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    return this.getHistoryProduct(req, page, limit);
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

  // 兼容 PHP: /api/user/user/delHistoryProduct
  @Post("user/delHistoryProduct")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "删除浏览历史（兼容路径）" })
  async deleteHistoryProductAlias(
    @Request() req,
    @Body() body: { productIds: number[] },
  ) {
    return this.deleteHistoryProduct(req, body);
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
    const userId = req.user?.user_id ?? req.user?.userId ?? req.user?.sub;
    return this.userService.uploadAvatar(Number(userId), file);
  }

  // 兼容 PHP: /api/user/user/uploadImg
  @Post("user/uploadImg")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "上传用户头像（兼容路径）" })
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  async uploadAvatarAlias(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.uploadAvatar(req, file);
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
    const userId = req.user?.user_id ?? req.user?.userId ?? req.user?.sub;
    return this.userService.modifyAvatar(Number(userId), file);
  }

  /**
   * 用户退出登录 - 对齐PHP版本 logout
   */
  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "用户退出登录" })
  async logout(@Request() req) {
    const userId = req.user?.user_id ?? req.user?.userId ?? req.user?.sub;
    return this.userService.logout(Number(userId));
  }

  // 兼容 PHP: /api/user/user/logout
  @Post("user/logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "用户退出登录（兼容路径）" })
  async logoutAlias(@Request() req) {
    return this.logout(req);
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

  // 兼容 PHP: /api/user/user/sendMobileCodeByModifyPassword
  @Post("user/sendMobileCodeByModifyPassword")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "发送修改密码验证码（兼容路径）" })
  async sendPasswordChangeCodeAlias(
    @Request() req,
    @Body() body: { mobile: string },
  ) {
    return this.sendPasswordChangeCode(req, body);
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

  // 兼容 PHP: /api/user/user/checkModifyPasswordMobileCode
  @Post("user/checkModifyPasswordMobileCode")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "验证修改密码验证码（兼容路径）" })
  async checkPasswordChangeCodeAlias(
    @Request() req,
    @Body() body: { mobile: string; code: string },
  ) {
    return this.checkPasswordChangeCode(req, body);
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

  // 兼容 PHP: /api/user/user/levelList
  @Get("user/levelList")
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户等级列表（兼容路径）" })
  async getLevelListAlias() {
    return this.getLevelList();
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

  // 兼容 PHP: /api/user/user/levelInfo
  @Get("user/levelInfo")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户等级信息（兼容路径）" })
  async getLevelInfoAlias(@Query("rank_id") rankId: number) {
    return this.getLevelInfo(rankId);
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

  // 兼容 PHP: /api/user/user/close
  @Post("user/close")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "注销账户（兼容路径）" })
  async closeAccountAlias(@Request() req) {
    return this.closeAccount(req);
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

  // 兼容 PHP: /api/user/user/userOpenId
  @Get("user/userOpenId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取用户OpenId（兼容路径）" })
  async getUserOpenIdAlias(@Request() req) {
    return this.getUserOpenId(req);
  }
}
