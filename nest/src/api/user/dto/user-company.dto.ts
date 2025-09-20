import { IsString, IsNumber, IsEnum, IsOptional, IsNotEmpty, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum CompanyType {
  PERSON = 1,
  COMPANY = 2,
}

export enum CompanyStatus {
  WAIT = 1,
  PASS = 2,
  REFUSE = 3,
}

export class CompanyDataDto {
  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  corporate_name?: string;

  @IsOptional()
  @IsString()
  contact_phone?: string;

  @IsOptional()
  @IsString()
  license_number?: string;

  @IsOptional()
  @IsString()
  license_img?: string;

  @IsOptional()
  @IsNumber()
  license_addr_province?: number[];

  @IsOptional()
  @IsString()
  license_addr_detail?: string;

  @IsOptional()
  @IsString()
  business_scope?: string;

  @IsOptional()
  @IsString()
  legal_representative?: string;
}

export class CompanyApplyDto {
  @IsOptional()
  @IsEnum(CompanyType, { message: '认证类型不正确' })
  type: CompanyType = CompanyType.COMPANY;

  @IsNotEmpty({ message: '企业认证数据不能为空' })
  @ValidateNested()
  @Type(() => CompanyDataDto)
  company_data: CompanyDataDto;
}

export class CompanyQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  size?: number = 10;

  @IsOptional()
  @IsEnum(CompanyType)
  type?: CompanyType;

  @IsOptional()
  @IsEnum(CompanyStatus)
  status?: CompanyStatus;

  @IsOptional()
  @IsString()
  username?: string;
}

export class CompanyAuditDto {
  @IsEnum(CompanyStatus, { message: '状态不正确' })
  status: CompanyStatus;

  @IsOptional()
  @IsString()
  audit_remark?: string;
}