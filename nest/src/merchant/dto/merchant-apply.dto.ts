import { Type, Transform } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ArrayNotEmpty,
} from "class-validator";

export class ApplyListQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number = 15;

  // 1 待审核 | 10 已通过 | 20 已拒绝
  @IsOptional()
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @Type(() => Number)
  @IsNumber()
  @IsIn([1, 10, 20])
  status?: number;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(["add_time", "merchant_apply_id", ""]) // 空串允许
  sortField?: string;

  @IsOptional()
  @IsIn(["ascend", "descend", ""]) // 空串允许
  sortOrder?: string;
}

export class ApplyDelDto {
  @IsOptional()
  @Transform(({ value }) => (value === "" || value === null ? undefined : value))
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
    return value;
  })
  @IsArray()
  ids?: number[];
}

export class ApplyAuditDto {
  @Transform(({ value }) => (value === "" ? undefined : value))
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  id!: number;

  // 10 通过 | 20 拒绝
  @Transform(({ value }) => (value === "" ? undefined : value))
  @Type(() => Number)
  @IsInt()
  @IsIn([10, 20])
  status!: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class ApplyBatchDto {
  @IsIn(["delete", "auditPass", "auditReject"])
  type!: "delete" | "auditPass" | "auditReject";

  @IsArray()
  @ArrayNotEmpty()
  ids!: number[];
}
