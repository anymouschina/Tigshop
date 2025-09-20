// @ts-nocheck
import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsEmail,
  IsPhoneNumber,
} from "class-validator";

export class CreatePriceInquiryDto {
  @ApiProperty({ description: "客户姓名" })
  @IsString()
  customer_name: string;

  @ApiProperty({ description: "联系电话" })
  @IsString()
  phone: string;

  @ApiProperty({ description: "邮箱", required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: "产品名称" })
  @IsString()
  product_name: string;

  @ApiProperty({ description: "产品规格", required: false })
  @IsString()
  @IsOptional()
  specification?: string;

  @ApiProperty({ description: "数量", required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiProperty({ description: "备注", required: false })
  @IsString()
  @IsOptional()
  remark?: string;
}

export class UpdatePriceInquiryDto {
  @ApiProperty({ description: "客户姓名", required: false })
  @IsString()
  @IsOptional()
  customer_name?: string;

  @ApiProperty({ description: "联系电话", required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: "邮箱", required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: "产品名称", required: false })
  @IsString()
  @IsOptional()
  product_name?: string;

  @ApiProperty({ description: "产品规格", required: false })
  @IsString()
  @IsOptional()
  specification?: string;

  @ApiProperty({ description: "数量", required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiProperty({ description: "备注", required: false })
  @IsString()
  @IsOptional()
  remark?: string;

  @ApiProperty({ description: "状态", required: false })
  @IsNumber()
  @IsOptional()
  status?: number;
}

export class QueryPriceInquiryDto {
  @ApiProperty({ description: "关键词", required: false })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({ description: "状态", required: false })
  @IsNumber()
  @IsOptional()
  status?: number;

  @ApiProperty({ description: "页码", default: 1 })
  @IsNumber()
  @Min(1)
  page: number = 1;

  @ApiProperty({ description: "每页数量", default: 15 })
  @IsNumber()
  @Min(1)
  @Max(100)
  size: number = 15;

  @ApiProperty({ description: "排序字段", default: "id" })
  @IsString()
  @IsOptional()
  sort_field?: string = "id";

  @ApiProperty({
    description: "排序方式",
    default: "desc",
    enum: ["asc", "desc"],
  })
  @IsString()
  @IsOptional()
  sort_order?: "asc" | "desc" = "desc";
}
