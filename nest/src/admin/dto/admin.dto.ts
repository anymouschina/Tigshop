// @ts-nocheck
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsBoolean, IsNumber, IsArray, MinLength, MaxLength, IsObject } from 'class-validator';

// 管理员登录DTO
export class AdminLoginDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  username: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  password: string;
}

// 创建管理员用户DTO
export class CreateAdminUserDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: '邮箱', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: '手机号', required: false })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ description: '头像', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}

// 更新管理员用户DTO
export class UpdateAdminUserDto {
  @ApiProperty({ description: '邮箱', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: '手机号', required: false })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ description: '头像', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}

// 修改密码DTO
export class UpdatePasswordDto {
  @ApiProperty({ description: '原密码' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ description: '新密码' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

// 管理员查询DTO
export class AdminQueryDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  @IsNumber()
  size?: number = 20;

  @ApiProperty({ description: '关键词', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '是否启用', required: false })
  @IsOptional()
  @IsBoolean()
  isEnable?: boolean;
}

// 创建角色DTO
export class CreateRoleDto {
  @ApiProperty({ description: '角色名称' })
  @IsString()
  @MaxLength(50)
  roleName: string;

  @ApiProperty({ description: '角色描述', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  roleDesc?: string;

  @ApiProperty({ description: '权限列表' })
  @IsArray()
  authorityList: any[];

  @ApiProperty({ description: '管理员类型', required: false })
  @IsOptional()
  @IsString()
  adminType?: string = 'admin';
}

// 更新角色DTO
export class UpdateRoleDto {
  @ApiProperty({ description: '角色名称', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  roleName?: string;

  @ApiProperty({ description: '角色描述', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  roleDesc?: string;

  @ApiProperty({ description: '权限列表', required: false })
  @IsOptional()
  @IsArray()
  authorityList?: any[];

  @ApiProperty({ description: '是否启用', required: false })
  @IsOptional()
  @IsBoolean()
  isEnable?: boolean;
}

// 角色查询DTO
export class RoleQueryDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  @IsNumber()
  size?: number = 20;

  @ApiProperty({ description: '关键词', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;
}

// 分配角色DTO
export class AssignRolesDto {
  @ApiProperty({ description: '角色ID列表' })
  @IsArray()
  @IsNumber({}, { each: true })
  roleIds: number[];
}

// 系统设置DTO
export class SystemSettingsDto {
  @ApiProperty({ description: '网站名称', required: false })
  @IsOptional()
  @IsString()
  siteName?: string;

  @ApiProperty({ description: '网站Logo', required: false })
  @IsOptional()
  @IsString()
  siteLogo?: string;

  @ApiProperty({ description: '网站描述', required: false })
  @IsOptional()
  @IsString()
  siteDescription?: string;

  @ApiProperty({ description: '联系邮箱', required: false })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiProperty({ description: '联系电话', required: false })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ description: '货币', required: false })
  @IsOptional()
  @IsString()
  currency?: string = 'CNY';

  @ApiProperty({ description: '语言', required: false })
  @IsOptional()
  @IsString()
  language?: string = 'zh-CN';

  @ApiProperty({ description: '时区', required: false })
  @IsOptional()
  @IsString()
  timezone?: string = 'Asia/Shanghai';
}

// 权限菜单DTO
export class PermissionMenuDto {
  @ApiProperty({ description: '菜单ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: '菜单名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '菜单图标', required: false })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty({ description: '菜单路径', required: false })
  @IsOptional()
  @IsString()
  path?: string;

  @ApiProperty({ description: '组件路径', required: false })
  @IsOptional()
  @IsString()
  component?: string;

  @ApiProperty({ description: '权限标识', required: false })
  @IsOptional()
  @IsString()
  permission?: string;

  @ApiProperty({ description: '父级ID', required: false })
  @IsOptional()
  @IsNumber()
  parentId?: number;

  @ApiProperty({ description: '排序', required: false })
  @IsOptional()
  @IsNumber()
  sort?: number;

  @ApiProperty({ description: '是否显示', required: false })
  @IsOptional()
  @IsBoolean()
  isShow?: boolean = true;

  @ApiProperty({ description: '子菜单', required: false })
  @IsOptional()
  @IsArray()
  children?: PermissionMenuDto[];
}

// 操作日志DTO
export class OperationLogDto {
  @ApiProperty({ description: '日志ID' })
  @IsNumber()
  logId: number;

  @ApiProperty({ description: '操作用户' })
  @IsString()
  username: string;

  @ApiProperty({ description: '操作类型' })
  @IsString()
  operation: string;

  @ApiProperty({ description: '操作描述' })
  @IsString()
  description: string;

  @ApiProperty({ description: '请求方法' })
  @IsString()
  method: string;

  @ApiProperty({ description: '请求路径' })
  @IsString()
  path: string;

  @ApiProperty({ description: '请求IP' })
  @IsString()
  ip: string;

  @ApiProperty({ description: '请求参数', required: false })
  @IsOptional()
  @IsObject()
  params?: any;

  @ApiProperty({ description: '操作结果', required: false })
  @IsOptional()
  @IsObject()
  result?: any;

  @ApiProperty({ description: '操作时间' })
  @IsString()
  createdAt: string;
}
