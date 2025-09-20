// @ts-nocheck
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  Min,
  Max,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export class SignInQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  size?: number = 15;

  @IsOptional()
  @IsString()
  sort_field?: string = "id";

  @IsOptional()
  @IsString()
  sort_order?: "asc" | "desc" = "desc";
}

export class SignInDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateSignInDto {
  @IsString()
  @Max(100)
  name: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  points: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  day_num: number;
}

export class UpdateSignInDto {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsOptional()
  @IsString()
  @Max(100)
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  points?: number;
}

export class DeleteSignInDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteSignInDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

// 用户签到相关DTO
export class UserSignInDto {
  @IsNumber()
  @Type(() => Number)
  user_id: number;
}
