// @ts-nocheck
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  ArrayMinSize,
} from "class-validator";

export class CreateCommentDto {
  @IsNumber()
  product_id: number;

  @IsNumber()
  order_id: number;

  @IsNumber()
  @IsOptional()
  order_item_id?: number;

  @IsNumber()
  @IsOptional()
  spec_value_id?: number;

  @IsNumber()
  score: number; // 1-5分

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMinSize(1)
  images?: string[]; // 图片URL数组

  @IsEnum(["good", "medium", "bad"], { message: "评价类型不正确" })
  comment_type?: "good" | "medium" | "bad" = "good";

  @IsOptional()
  @IsString()
  reply_content?: string;
}

export class CommentQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  size?: number = 10;

  @IsOptional()
  @IsNumber()
  product_id?: number;

  @IsOptional()
  @IsEnum(["good", "medium", "bad"])
  comment_type?: string;

  @IsOptional()
  @IsEnum(["all", "with_image", "with_content"])
  filter_type?: string = "all";

  @IsOptional()
  @IsEnum(["newest", "hottest", "highest_score"])
  sort_type?: string = "newest";
}

export class ReplyCommentDto {
  @IsNumber()
  comment_id: number;

  @IsString()
  reply_content: string;
}
