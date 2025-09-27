import { IsOptional, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetUserMessageListDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 15 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  size?: number = 15;

  @ApiPropertyOptional({ description: '是否只显示未读消息：0-全部，1-未读', default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  unread?: number = 0;
}

export class UpdateMessageReadDto {
  @ApiPropertyOptional({ description: '消息ID' })
  @Type(() => Number)
  @IsInt()
  id: number;
}