// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class ProductPromotionListDto {
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsInt() promotion_type?: number;
  @IsOptional() @IsInt() is_going?: number; // 1 进行中 0 非进行中
  @IsOptional() @IsInt() page?: number;
  @IsOptional() @IsInt() size?: number;
  @IsOptional() @IsString() sort_field?: string;
  @IsOptional() @IsString() sort_order?: "asc" | "desc";
}

export class ProductPromotionCountDto {
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsInt() promotion_type?: number;
}

export class ProductPromotionConflictDto {
  @IsOptional() @IsNumber() start_time?: number;
  @IsOptional() @IsNumber() end_time?: number;
  @IsOptional() @IsInt() promotion_type?: number;
  @IsOptional() @IsInt() page?: number;
  @IsOptional() @IsInt() size?: number;
}

export class ProductPromotionDetailDto {
  @ApiProperty() @IsInt() promotion_id: number;
}

export class ProductPromotionCreateDto {
  @ApiProperty() @IsString() promotion_name: string;
  @ApiProperty() @IsNumber() start_time: number;
  @ApiProperty() @IsNumber() end_time: number;
  @IsOptional() @IsString() limit_user_rank?: string;
  @ApiProperty() @IsInt() range: number;
  @IsOptional() @IsArray() range_data?: any[];
  @IsOptional() @IsNumber() min_order_amount?: number;
  @IsOptional() @IsNumber() max_order_amount?: number;
  @ApiProperty() @IsInt() promotion_type: number;
  @IsOptional() promotion_type_data?: any;
  @IsOptional() @IsInt() is_available?: number;
  @IsOptional() @IsInt() sort_order?: number;
  @IsOptional() @IsInt() rules_type?: number;
  @IsOptional() @IsInt() unit?: number;
}

export class ProductPromotionUpdateDto {
  @IsOptional() @IsString() promotion_name?: string;
  @IsOptional() @IsNumber() start_time?: number;
  @IsOptional() @IsNumber() end_time?: number;
  @IsOptional() @IsString() limit_user_rank?: string;
  @IsOptional() @IsInt() range?: number;
  @IsOptional() @IsArray() range_data?: any[];
  @IsOptional() @IsNumber() min_order_amount?: number;
  @IsOptional() @IsNumber() max_order_amount?: number;
  @IsOptional() @IsInt() promotion_type?: number;
  @IsOptional() promotion_type_data?: any;
  @IsOptional() @IsInt() is_available?: number;
  @IsOptional() @IsInt() sort_order?: number;
  @IsOptional() @IsInt() rules_type?: number;
  @IsOptional() @IsInt() unit?: number;
}

export class ProductPromotionBatchDto {
  @ApiProperty({ type: [Number] }) @IsArray() ids: number[];
}
