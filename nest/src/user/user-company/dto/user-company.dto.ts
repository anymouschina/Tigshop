// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsEmail,
  IsEnum,
} from "class-validator";

export enum UserCompanyStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

export enum UserCompanyType {
  ENTERPRISE = 0,
  INDIVIDUAL = 1,
  OTHER = 2,
}

export class QueryUserCompanyDto {
  @ApiProperty({ description: "用户名", required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ description: "类型", required: false })
  @IsOptional()
  @IsNumber()
  type?: number;

  @ApiProperty({ description: "状态", required: false })
  @IsOptional()
  @IsNumber()
  status?: number;

  @ApiProperty({ description: "页码", default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiProperty({ description: "每页数量", default: 15 })
  @IsOptional()
  @IsNumber()
  size?: number;

  @ApiProperty({ description: "排序字段", default: "id" })
  @IsOptional()
  @IsString()
  sort_field?: string;

  @ApiProperty({ description: "排序方式", default: "desc" })
  @IsOptional()
  @IsString()
  sort_order?: string;
}

export class CreateUserCompanyDto {
  @ApiProperty({ description: "用户ID" })
  @IsNumber()
  user_id: number;

  @ApiProperty({ description: "公司名称" })
  @IsString()
  company_name: string;

  @ApiProperty({ description: "公司类型" })
  @IsEnum(UserCompanyType)
  company_type: UserCompanyType;

  @ApiProperty({ description: "营业执照" })
  @IsString()
  business_license: string;

  @ApiProperty({ description: "法人姓名" })
  @IsString()
  legal_person: string;

  @ApiProperty({ description: "联系人" })
  @IsString()
  contact_person: string;

  @ApiProperty({ description: "联系电话" })
  @IsString()
  contact_phone: string;

  @ApiProperty({ description: "联系邮箱" })
  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @ApiProperty({ description: "经营地址" })
  @IsString()
  business_address: string;

  @ApiProperty({ description: "经营范围" })
  @IsOptional()
  @IsString()
  business_scope?: string;
}

export class UpdateUserCompanyDto {
  @ApiProperty({ description: "公司名称", required: false })
  @IsOptional()
  @IsString()
  company_name?: string;

  @ApiProperty({ description: "公司类型", required: false })
  @IsOptional()
  @IsEnum(UserCompanyType)
  company_type?: UserCompanyType;

  @ApiProperty({ description: "营业执照", required: false })
  @IsOptional()
  @IsString()
  business_license?: string;

  @ApiProperty({ description: "法人姓名", required: false })
  @IsOptional()
  @IsString()
  legal_person?: string;

  @ApiProperty({ description: "联系人", required: false })
  @IsOptional()
  @IsString()
  contact_person?: string;

  @ApiProperty({ description: "联系电话", required: false })
  @IsOptional()
  @IsString()
  contact_phone?: string;

  @ApiProperty({ description: "联系邮箱", required: false })
  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @ApiProperty({ description: "经营地址", required: false })
  @IsOptional()
  @IsString()
  business_address?: string;

  @ApiProperty({ description: "经营范围", required: false })
  @IsOptional()
  @IsString()
  business_scope?: string;
}

export class AuditUserCompanyDto {
  @ApiProperty({ description: "企业认证ID" })
  @IsNumber()
  id: number;

  @ApiProperty({ description: "审核状态" })
  @IsEnum(UserCompanyStatus)
  status: UserCompanyStatus;

  @ApiProperty({ description: "审核备注" })
  @IsOptional()
  @IsString()
  audit_remark?: string;
}
