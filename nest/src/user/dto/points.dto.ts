// @ts-nocheck
import { IsInt, IsOptional, IsString, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum PointsType {
  EARN = "earn",
  SPEND = "spend",
}

export enum PointsSourceType {
  ORDER = "order",
  SIGN_IN = "sign_in",
  REFERRAL = "referral",
  RECHARGE = "recharge",
  EXCHANGE = "exchange",
  ADMIN_ADJUST = "admin_adjust",
}

export class QueryPointsLogDto {
  @ApiProperty({ description: "积分类型", enum: PointsType, required: false })
  @IsOptional()
  @IsEnum(PointsType)
  type?: PointsType;

  @ApiProperty({
    description: "来源类型",
    enum: PointsSourceType,
    required: false,
  })
  @IsOptional()
  @IsEnum(PointsSourceType)
  sourceType?: PointsSourceType;

  @ApiProperty({ description: "页码", required: false })
  @IsOptional()
  @IsInt()
  page?: number = 1;

  @ApiProperty({ description: "每页数量", required: false })
  @IsOptional()
  @IsInt()
  limit?: number = 10;
}

export class CreatePointsLogDto {
  @ApiProperty({ description: "积分类型", enum: PointsType })
  @IsEnum(PointsType)
  type: PointsType;

  @ApiProperty({ description: "来源类型", enum: PointsSourceType })
  @IsEnum(PointsSourceType)
  sourceType: PointsSourceType;

  @ApiProperty({ description: "积分数量" })
  @IsInt()
  points: number;

  @ApiProperty({ description: "描述" })
  @IsString()
  description: string;

  @ApiProperty({ description: "关联ID", required: false })
  @IsOptional()
  @IsInt()
  relatedId?: number;
}

export class ExchangePointsDto {
  @ApiProperty({ description: "兑换的积分数量" })
  @IsInt()
  points: number;

  @ApiProperty({ description: "兑换类型" })
  @IsString()
  exchangeType: string;

  @ApiProperty({ description: "兑换描述" })
  @IsString()
  description: string;
}
