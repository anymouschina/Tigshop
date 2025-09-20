// @ts-nocheck
import { IsString, IsNumber, IsEnum, IsOptional, IsNotEmpty, IsArray, IsDecimal, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum AftersalesType {
  RETURN_REFUND = 1,
  REFUND_ONLY = 2,
}

export enum AftersalesStatus {
  IN_REVIEW = 1,
  APPROVED_FOR_PROCESSING = 2,
  REFUSE = 3,
  SEND_BACK = 4,
  RETURNED = 5,
  COMPLETE = 6,
  CANCEL = 7,
  WAIT_FOR_SUPPLIER_AUDIT = 21,
  WAIT_FOR_SUPPLIER_RECEIPT = 22,
}

export const AFTERSALES_TYPE_NAME = {
  [AftersalesType.REFUND_ONLY]: '仅退款',
  [AftersalesType.RETURN_REFUND]: '退货/退款',
};

export const AFTERSALES_REASON = [
  '多拍/拍错/不喜欢',
  '未按约定时间发货',
  '协商一致退款',
  '地址/电话填错了',
  '其他',
];

export const STATUS_NAME = {
  [AftersalesStatus.IN_REVIEW]: '审核处理中',
  [AftersalesStatus.APPROVED_FOR_PROCESSING]: '审核通过',
  [AftersalesStatus.REFUSE]: '审核未通过',
  [AftersalesStatus.SEND_BACK]: '待用户回寄',
  [AftersalesStatus.RETURNED]: '待商家收货',
  [AftersalesStatus.COMPLETE]: '已完成',
  [AftersalesStatus.CANCEL]: '已取消',
  [AftersalesStatus.WAIT_FOR_SUPPLIER_AUDIT]: '待供应商审核',
  [AftersalesStatus.WAIT_FOR_SUPPLIER_RECEIPT]: '待供应商收货',
};

export class AftersalesItemDto {
  @IsNotEmpty({ message: '订单商品ID不能为空' })
  @IsNumber({}, { message: '订单商品ID必须为数字' })
  order_item_id: number;

  @IsNotEmpty({ message: '数量不能为空' })
  @IsNumber({}, { message: '数量必须为数字' })
  number: number;
}

export class CreateAftersalesDto {
  @IsNotEmpty({ message: '订单ID不能为空' })
  @IsNumber({}, { message: '订单ID必须为数字' })
  order_id: number;

  @IsNotEmpty({ message: '售后类型不能为空' })
  @IsEnum(AftersalesType, { message: '售后类型不正确' })
  aftersale_type: AftersalesType;

  @IsNotEmpty({ message: '售后原因不能为空' })
  @IsString({ message: '售后原因必须为字符串' })
  aftersale_reason: string;

  @IsOptional()
  @IsString({ message: '描述必须为字符串' })
  description?: string;

  @IsNotEmpty({ message: '退款金额不能为空' })
  @IsNumber({}, { message: '退款金额必须为数字' })
  refund_amount: number;

  @IsOptional()
  @IsArray({ message: '图片必须为数组' })
  pics?: string[];

  @IsNotEmpty({ message: '售后商品不能为空' })
  @ValidateNested({ each: true })
  @Type(() => AftersalesItemDto)
  items: AftersalesItemDto[];
}

export class UpdateAftersalesDto {
  @IsNotEmpty({ message: '售后ID不能为空' })
  @IsNumber({}, { message: '售后ID必须为数字' })
  aftersale_id: number;

  @IsNotEmpty({ message: '订单ID不能为空' })
  @IsNumber({}, { message: '订单ID必须为数字' })
  order_id: number;

  @IsNotEmpty({ message: '售后类型不能为空' })
  @IsEnum(AftersalesType, { message: '售后类型不正确' })
  aftersale_type: AftersalesType;

  @IsNotEmpty({ message: '售后原因不能为空' })
  @IsString({ message: '售后原因必须为字符串' })
  aftersale_reason: string;

  @IsOptional()
  @IsString({ message: '描述必须为字符串' })
  description?: string;

  @IsNotEmpty({ message: '退款金额不能为空' })
  @IsNumber({}, { message: '退款金额必须为数字' })
  refund_amount: number;

  @IsOptional()
  @IsArray({ message: '图片必须为数组' })
  pics?: string[];

  @IsNotEmpty({ message: '售后商品不能为空' })
  @ValidateNested({ each: true })
  @Type(() => AftersalesItemDto)
  items: AftersalesItemDto[];
}

export class AftersalesFeedbackDto {
  @IsNotEmpty({ message: '售后ID不能为空' })
  @IsNumber({}, { message: '售后ID必须为数字' })
  id: number;

  @IsOptional()
  @IsString({ message: '日志信息必须为字符串' })
  log_info?: string;

  @IsOptional()
  @IsArray({ message: '回寄图片必须为数组' })
  return_pic?: string[];

  @IsOptional()
  @IsString({ message: '物流公司名称必须为字符串' })
  logistics_name?: string;

  @IsOptional()
  @IsString({ message: '物流单号必须为字符串' })
  tracking_no?: string;
}

export class AftersalesQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  size?: number = 15;

  @IsOptional()
  @IsString()
  sort_field?: string = 'order_id';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort_order?: 'asc' | 'desc' = 'desc';
}

export class ApplyDataDto {
  @IsOptional()
  @IsNumber()
  item_id?: number;

  @IsOptional()
  @IsNumber()
  order_id?: number;
}
