import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, Min, Max, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum MailTemplateType {
  TEMPLATE = 'template',
  MAGAZINE = 'magazine',
}

export class MailTemplateQueryDto {
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
  sort_field?: string = 'template_id';

  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  template_code?: string;

  @IsOptional()
  @IsEnum(MailTemplateType)
  type?: MailTemplateType;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  paging?: boolean = true;
}

export class MailTemplateDetailDto {
  @IsNumber()
  @Type(() => Number)
  template_id: number;
}

export class CreateMailTemplateDto {
  @IsString()
  template_code: string;

  @IsBoolean()
  @Type(() => Boolean)
  is_html: boolean;

  @IsString()
  template_subject: string;

  @IsString()
  template_content: string;

  @IsOptional()
  @IsEnum(MailTemplateType)
  type?: MailTemplateType = MailTemplateType.TEMPLATE;
}

export class UpdateMailTemplateDto {
  @IsNumber()
  @Type(() => Number)
  template_id: number;

  @IsOptional()
  @IsString()
  template_code?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_html?: boolean;

  @IsOptional()
  @IsString()
  template_subject?: string;

  @IsOptional()
  @IsString()
  template_content?: string;

  @IsOptional()
  @IsEnum(MailTemplateType)
  type?: MailTemplateType;
}

export class UpdateMailTemplateFieldDto {
  @IsNumber()
  @Type(() => Number)
  template_id: number;

  @IsString()
  field: string;

  value: any;
}

export class DeleteMailTemplateDto {
  @IsNumber()
  @Type(() => Number)
  template_id: number;
}

export class BatchDeleteMailTemplateDto {
  @IsArray()
  @IsNumber({}, { each: true })
  template_ids: number[];
}