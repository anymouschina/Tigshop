// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Patch,
  Delete,
  Put,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import {
  CreateAdminUserDto,
  UpdateAdminUserDto,
  CreateRoleDto,
  UpdateRoleDto,
  AdminQueryDto,
  RoleQueryDto,
  UpdatePasswordDto,
  AdminLoginDto,
  AssignRolesDto,
} from "./dto/admin.dto";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@ApiTags("后台管理")
@Controller("admin")
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post("login")
  @ApiOperation({ summary: "管理员登录" })
  @ApiResponse({ status: 200, description: "登录成功" })
  @ApiBody({ type: AdminLoginDto })
  async login(@Body() loginDto: AdminLoginDto) {
    return this.adminService.login(loginDto);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "管理员登出" })
  @ApiResponse({ status: 200, description: "登出成功" })
  async logout(@Request() req) {
    return this.adminService.logout(req.user.userId);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "获取管理员个人信息" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getProfile(@Request() req) {
    return this.adminService.getAdminProfile(req.user.userId);
  }

  @Patch("profile")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "更新管理员个人信息" })
  @ApiResponse({ status: 200, description: "更新成功" })
  @ApiBody({ type: UpdateAdminUserDto })
  async updateProfile(@Request() req, @Body() updateDto: UpdateAdminUserDto) {
    return this.adminService.updateAdminProfile(req.user.userId, updateDto);
  }

  @Post("change-password")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "修改密码" })
  @ApiResponse({ status: 200, description: "密码修改成功" })
  @ApiBody({ type: UpdatePasswordDto })
  async changePassword(@Request() req, @Body() passwordDto: UpdatePasswordDto) {
    return this.adminService.changePassword(req.user.userId, passwordDto);
  }

  // 管理员用户管理
  @Post("users")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @ApiOperation({ summary: "创建管理员用户" })
  @ApiResponse({ status: 201, description: "创建成功" })
  @ApiBody({ type: CreateAdminUserDto })
  async createAdminUser(@Body() createUserDto: CreateAdminUserDto) {
    return this.adminService.createAdminUser(createUserDto);
  }

  @Get("users")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @ApiOperation({ summary: "获取管理员用户列表" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAdminUsers(@Query() queryDto: AdminQueryDto) {
    return this.adminService.getAdminUsers(queryDto);
  }

  @Get("users/:adminId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @ApiOperation({ summary: "获取管理员用户详情" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getAdminUser(@Param("adminId") adminId: string) {
    return this.adminService.getAdminUser(parseInt(adminId));
  }

  @Put("users/:adminId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @ApiOperation({ summary: "更新管理员用户" })
  @ApiResponse({ status: 200, description: "更新成功" })
  @ApiBody({ type: UpdateAdminUserDto })
  async updateAdminUser(
    @Param("adminId") adminId: string,
    @Body() updateDto: UpdateAdminUserDto,
  ) {
    return this.adminService.updateAdminUser(parseInt(adminId), updateDto);
  }

  @Delete("users/:adminId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @ApiOperation({ summary: "删除管理员用户" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async deleteAdminUser(@Param("adminId") adminId: string) {
    return this.adminService.deleteAdminUser(parseInt(adminId));
  }

  @Patch("users/:adminId/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @ApiOperation({ summary: "启用/禁用管理员用户" })
  @ApiResponse({ status: 200, description: "状态更新成功" })
  async toggleAdminUserStatus(
    @Param("adminId") adminId: string,
    @Body("isEnable") isEnable: boolean,
  ) {
    return this.adminService.toggleAdminUserStatus(parseInt(adminId), isEnable);
  }

  // 角色管理
  @Post("roles")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @ApiOperation({ summary: "创建角色" })
  @ApiResponse({ status: 201, description: "创建成功" })
  @ApiBody({ type: CreateRoleDto })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.adminService.createRole(createRoleDto);
  }

  @Get("roles")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @ApiOperation({ summary: "获取角色列表" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getRoles(@Query() queryDto: RoleQueryDto) {
    return this.adminService.getRoles(queryDto);
  }

  @Get("roles/:roleId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @ApiOperation({ summary: "获取角色详情" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getRole(@Param("roleId") roleId: string) {
    return this.adminService.getRole(parseInt(roleId));
  }

  @Put("roles/:roleId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @ApiOperation({ summary: "更新角色" })
  @ApiResponse({ status: 200, description: "更新成功" })
  @ApiBody({ type: UpdateRoleDto })
  async updateRole(
    @Param("roleId") roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.adminService.updateRole(parseInt(roleId), updateRoleDto);
  }

  @Delete("roles/:roleId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @ApiOperation({ summary: "删除角色" })
  @ApiResponse({ status: 200, description: "删除成功" })
  async deleteRole(@Param("roleId") roleId: string) {
    return this.adminService.deleteRole(parseInt(roleId));
  }

  @Post("users/:adminId/roles")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @ApiOperation({ summary: "分配角色给管理员用户" })
  @ApiResponse({ status: 200, description: "角色分配成功" })
  @ApiBody({ type: AssignRolesDto })
  async assignRolesToUser(
    @Param("adminId") adminId: string,
    @Body() assignRolesDto: AssignRolesDto,
  ) {
    return this.adminService.assignRolesToUser(
      parseInt(adminId),
      assignRolesDto.roleIds,
    );
  }

  // 系统统计
  @Get("dashboard/statistics")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "获取仪表板统计信息" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getDashboardStatistics() {
    return this.adminService.getDashboardStatistics();
  }

  // 系统日志
  @Get("logs")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @ApiOperation({ summary: "获取系统日志" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getSystemLogs(
    @Query("page") page?: number,
    @Query("size") size?: number,
    @Query("level") level?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.adminService.getSystemLogs({
      page,
      size,
      level,
      startDate,
      endDate,
    });
  }

  // 系统设置
  @Get("settings")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @ApiOperation({ summary: "获取系统设置" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getSystemSettings() {
    return this.adminService.getSystemSettings();
  }

  @Put("settings")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("super_admin")
  @ApiOperation({ summary: "更新系统设置" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async updateSystemSettings(@Body() settings: any) {
    return this.adminService.updateSystemSettings(settings);
  }
}
