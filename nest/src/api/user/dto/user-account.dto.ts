// @ts-nocheck
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
  MaxLength,
  MinLength,
} from "class-validator";

export class BalanceQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  size?: number = 10;

  @IsOptional()
  @IsEnum(["all", "income", "expense"])
  type?: string = "all";
}

export class WithdrawApplyDto {
  @IsNumber()
  @Min(0.01, { message: "提现金额必须大于0.01" })
  amount: number;

  @IsString()
  @MaxLength(50, { message: "提现密码不能超过50个字符" })
  withdraw_password: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: "备注不能超过200个字符" })
  remark?: string;
}

export class RechargeOrderDto {
  @IsNumber()
  @Min(0.01, { message: "充值金额必须大于0.01" })
  amount: number;

  @IsEnum(["wechat", "alipay", "bank"], { message: "支付方式不正确" })
  payment_method: "wechat" | "alipay" | "bank";

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: "备注不能超过200个字符" })
  remark?: string;
}

export class SetWithdrawPasswordDto {
  @IsString()
  @MinLength(6, { message: "提现密码长度至少6位" })
  password: string;

  @IsString()
  confirm_password: string;
}

export class VerifyWithdrawPasswordDto {
  @IsString()
  password: string;
}
