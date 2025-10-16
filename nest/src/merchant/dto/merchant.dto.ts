import { Type, Transform } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";

export class MerchantListQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  // 允许字符串传入，后续在控制器中 Number() 处理
  @IsOptional()
  @Transform(({ value }) =>
    value === "" || value === null ? undefined : value,
  )
  @Type(() => Number)
  @IsInt()
  status?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  size?: number;

  @IsOptional()
  @IsString()
  @IsIn(["add_time", "merchant_id"]) // 白名单
  sortField?: "add_time" | "merchant_id";

  @IsOptional()
  @IsString()
  @IsIn(["ascend", "descend"]) // 前端约定
  sortOrder?: "ascend" | "descend";
}

class AdminBindDto {
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2]) // 1 会员, 2 管理员
  type!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  userId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  adminId?: number;
}

export class CreateMerchantDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminBindDto)
  admin?: AdminBindDto;

  @IsOptional()
  @IsObject()
  baseData?: any;

  @IsOptional()
  @IsObject()
  merchantData?: any;

  @IsOptional()
  @IsString()
  shopTitle?: string;

  // 1 个人 | 2 企业
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2])
  type?: number;
}

export class UpdateMerchantDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  merchantId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminBindDto)
  admin?: AdminBindDto;

  @IsOptional()
  @IsObject()
  baseData?: any;

  @IsOptional()
  @IsObject()
  merchantData?: any;

  @IsOptional()
  @IsString()
  shopTitle?: string;
}

export class UpdateFieldDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id!: number;

  @IsString()
  @IsIn([
    "status",
    "type",
    "company_name",
    "corporate_name",
    "settlement_cycle",
  ]) // 与控制器白名单一致
  field!: string;

  // 任意值
  value: any;
}

export class OperateMerchantDto {
  @IsString()
  @IsIn(["approve", "reject", "enable", "disable"])
  action!: "approve" | "reject" | "enable" | "disable";

  @IsOptional()
  @IsString()
  reason?: string;
}
