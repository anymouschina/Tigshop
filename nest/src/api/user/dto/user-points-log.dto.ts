// @ts-nocheck
import { IsString, IsNumber, IsEnum, IsOptional, IsDateString } from 'class-validator';

export class PointsLogQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  size?: number = 10;

  @IsOptional()
  @IsEnum(['all', 'income', 'expense'])
  type?: string = 'all';

  @IsOptional()
  @IsEnum(['sign', 'order', 'referral', 'exchange', 'admin', 'other'])
  log_type?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}
