// @ts-nocheck
import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';

export enum CommentRating {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
}

export enum CommentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class CreateCommentDto {
  @IsNumber()
  productId: number;

  @IsEnum(CommentRating)
  @Min(1)
  @Max(5)
  rating: CommentRating;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  images?: string;

  @IsString()
  @IsOptional()
  orderSn?: string;

  @IsNumber()
  @IsOptional()
  replyId?: number;

  @IsString()
  @IsOptional()
  replyContent?: string;
}

export class UpdateCommentDto {
  @IsEnum(CommentRating)
  @IsOptional()
  @Min(1)
  @Max(5)
  rating?: CommentRating;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  images?: string;

  @IsEnum(CommentStatus)
  @IsOptional()
  status?: CommentStatus;

  @IsString()
  @IsOptional()
  replyContent?: string;
}

export class GetCommentsDto {
  @IsNumber()
  @IsOptional()
  productId?: number;

  @IsNumber()
  @IsOptional()
  userId?: number;

  @IsEnum(CommentStatus)
  @IsOptional()
  status?: CommentStatus;

  @IsEnum(CommentRating)
  @IsOptional()
  rating?: CommentRating;

  @IsNumber()
  @IsOptional()
  page?: number;

  @IsNumber()
  @IsOptional()
  size?: number;
}

export class CommentReplyDto {
  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  images?: string;
}
