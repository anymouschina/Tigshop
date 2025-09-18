import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsBoolean, Min, Max, IsArray, ArrayNotEmpty } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum OrderStatus {
  PENDING = 0,      // 待确认，待支付
  CONFIRMED = 1,    // 已确认，待发货
  PROCESSING = 2,   // 处理中，已发货
  CANCELLED = 3,    // 已取消
  INVALID = 4,      // 无效
  COMPLETED = 5,     // 已完成
}

export enum ShippingStatus {
  PENDING = 0,      // 待发货
  SENT = 1,         // 已发货
  SHIPPED = 2,      // 已收货
  FAILED = 3,       // 配送失败
}

export enum PayStatus {
  UNPAID = 0,       // 未支付
  PROCESSING = 1,   // 支付中
  PAID = 2,         // 已支付
  REFUNDING = 3,    // 退款中
  REFUNDED = 4,     // 已退款
}

export enum CommentStatus {
  PENDING = 0,      // 待评价
  COMPLETED = 1,    // 已评价
}

export enum PayTypeId {
  ONLINE = 1,       // 在线支付
  CASH = 2,         // 货到付款
  OFFLINE = 3,      // 线下支付
}

export enum OrderType {
  NORMAL = 1,       // 普通商品订单
  PIN = 2,          // 拼团商品订单
  EXCHANGE = 3,     // 兑换商品订单
  BARGAIN = 5,      // 砍一砍商品订单
  VIRTUAL = 6,      // 虚拟商品订单
  PAID = 7,         // 付费商品订单
  CARD = 8,         // 卡密商品订单
}

export class CreateOrderDto {
  @ApiProperty({ description: '用户ID' })
  @IsNumber()
  @Type(() => Number)
  userId: number;

  @ApiProperty({ description: '店铺ID', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  shopId?: number = 1;

  @ApiProperty({ description: '收货人姓名' })
  @IsString()
  consignee: string;

  @ApiProperty({ description: '收货人手机' })
  @IsString()
  mobile: string;

  @ApiProperty({ description: '收货地址' })
  @IsString()
  address: string;

  @ApiProperty({ description: '地区ID列表' })
  @IsOptional()
  @IsArray()
  regionIds?: number[];

  @ApiProperty({ description: '地区名称列表' })
  @IsOptional()
  @IsArray()
  regionNames?: string[];

  @ApiProperty({ description: '订单商品' })
  @IsArray()
  @ArrayNotEmpty()
  items: OrderItemDto[];

  @ApiProperty({ description: '商品总金额' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  productAmount: number;

  @ApiProperty({ description: '运费' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  shippingFee: number = 0;

  @ApiProperty({ description: '优惠金额' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  discountAmount: number = 0;

  @ApiProperty({ description: '使用余额' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  balance: number = 0;

  @ApiProperty({ description: '使用积分' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  usePoints: number = 0;

  @ApiProperty({ description: '积分抵扣金额' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  pointsAmount: number = 0;

  @ApiProperty({ description: '优惠券金额' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  couponAmount: number = 0;

  @ApiProperty({ description: '订单总金额' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  totalAmount: number;

  @ApiProperty({ description: '订单备注' })
  @IsOptional()
  @IsString()
  buyerNote?: string;

  @ApiProperty({ description: '支付方式ID', enum: PayTypeId })
  @IsOptional()
  @IsEnum(PayTypeId)
  payTypeId?: PayTypeId = PayTypeId.ONLINE;

  @ApiProperty({ description: '订单类型', enum: OrderType })
  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType = OrderType.NORMAL;

  @ApiProperty({ description: '发票信息' })
  @IsOptional()
  @IsString()
  invoiceData?: string;

  @ApiProperty({ description: '配送方式' })
  @IsOptional()
  @IsString()
  shippingType?: string;
}

export class OrderItemDto {
  @ApiProperty({ description: '商品ID' })
  @IsNumber()
  @Type(() => Number)
  productId: number;

  @ApiProperty({ description: '规格ID' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  skuId?: number;

  @ApiProperty({ description: '商品名称' })
  @IsString()
  productName: string;

  @ApiProperty({ description: '商品编号' })
  @IsString()
  productSn: string;

  @ApiProperty({ description: '商品图片' })
  @IsString()
  productImage: string;

  @ApiProperty({ description: '规格值' })
  @IsOptional()
  @IsString()
  skuValue?: string;

  @ApiProperty({ description: '购买数量' })
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number;

  @ApiProperty({ description: '商品单价' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;

  @ApiProperty({ description: '商品重量' })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  productWeight: number = 0;

  @ApiProperty({ description: 'SKU数据' })
  @IsOptional()
  @IsString()
  skuData?: string;
}
