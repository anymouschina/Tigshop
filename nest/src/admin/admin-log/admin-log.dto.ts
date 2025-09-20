// @ts-nocheck
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  Max,
  IsInt,
  MaxLength,
  IsDate,
} from "class-validator";
import { Type, Transform } from "class-transformer";

export class AdminLogQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  admin_id?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  type?: number = -1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  module?: number = -1;

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
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

export class AdminLogDetailDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class CreateAdminLogDto {
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  admin_id: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(10)
  type: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(50)
  module: number;

  @IsString()
  @MaxLength(500)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(45)
  ip?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  user_agent?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(255)
  url?: string = "";

  @IsOptional()
  @IsString()
  @MaxLength(20)
  method?: string = "";

  @IsOptional()
  @IsString()
  params?: string = "";
}

export class DeleteAdminLogDto {
  @IsNumber()
  @Type(() => Number)
  id: number;
}

export class BatchDeleteAdminLogDto {
  @IsArray()
  @IsNumber({}, { each: true })
  ids: number[];
}

export const ADMIN_LOG_TYPE = {
  0: "查看",
  1: "新增",
  2: "修改",
  3: "删除",
  4: "审核",
  5: "导出",
  6: "导入",
  7: "登录",
  8: "登出",
  9: "其他",
  10: "批量操作",
};

export const ADMIN_LOG_MODULE = {
  0: "用户管理",
  1: "商品管理",
  2: "订单管理",
  3: "财务管理",
  4: "营销管理",
  5: "系统设置",
  6: "权限管理",
  7: "内容管理",
  8: "统计报表",
  9: "工具管理",
  10: "其他",
  11: "管理员",
  12: "角色权限",
  13: "日志管理",
  14: "缓存管理",
  15: "文件管理",
  16: "支付管理",
  17: "物流管理",
  18: "消息管理",
  19: "评价管理",
  20: "收藏管理",
  21: "地址管理",
  22: "发票管理",
  23: "充值管理",
  24: "提现管理",
  25: "退款管理",
  26: "售后管理",
  27: "优惠券管理",
  28: "促销管理",
  29: "秒杀管理",
  30: "团购管理",
  31: "砍价管理",
  32: "积分管理",
  33: "签到管理",
  34: "直播管理",
  35: "分享管理",
  36: "打印管理",
  37: "验证管理",
  38: "工具管理",
  39: "区域管理",
  40: "提示管理",
  41: "版本管理",
  42: "运费模板",
  43: "配送方式",
  44: "图库管理",
  45: "友情链接",
  46: "许可证管理",
  47: "文章分类",
  48: "首页管理",
  49: "账户面板",
  50: "订单发票",
};
