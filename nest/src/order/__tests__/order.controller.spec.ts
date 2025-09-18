import { Test, TestingModule } from '@nestjs/testing';
import { OrderController } from '../order.controller';
import { OrderService } from '../order.service';
import { CreateOrderDto, OrderStatus, ShippingStatus, PayStatus, OrderType, PayTypeId } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { OrderQueryDto } from '../dto/order-query.dto';
import { ApplyCouponDto } from '../../coupon/dto/apply-coupon.dto';
import { CouponService } from '../../coupon/coupon.service';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

// Mock the OrderService
const mockOrderService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  updateStatus: jest.fn(),
  cancel: jest.fn(),
  confirm: jest.fn(),
  ship: jest.fn(),
  receive: jest.fn(),
  remove: jest.fn(),
  restore: jest.fn(),
  getStatistics: jest.fn(),
};

// Mock the CouponService
const mockCouponService = {
  getCoupun: jest.fn(),
};

describe('OrderController', () => {
  let controller: OrderController;
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
        {
          provide: CouponService,
          useValue: mockCouponService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrderController>(OrderController);
    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an order successfully', async () => {
      const createOrderDto: CreateOrderDto = {
        userId: 1,
        shopId: 1,
        items: [
          {
            productId: 1,
            quantity: 2,
            price: 100,
            productName: 'Test Product',
            productSn: 'TEST001',
            productImage: 'test.jpg',
            productWeight: 1,
          },
        ],
        productAmount: 200,
        shippingFee: 10,
        discountAmount: 0,
        balance: 0,
        usePoints: 0,
        pointsAmount: 0,
        couponAmount: 0,
        totalAmount: 210,
        orderType: OrderType.NORMAL,
        consignee: 'Test User',
        mobile: '1234567890',
        address: 'Test Address',
        payTypeId: PayTypeId.ONLINE,
      };

      const mockOrder = {
        orderId: 1,
        orderSn: 'ORDER_123456',
        userId: 1,
        totalAmount: 210,
        status: OrderStatus.PENDING,
      };

      mockOrderService.create.mockResolvedValue(mockOrder);

      const result = await controller.create(createOrderDto);

      expect(result).toEqual(mockOrder);
      expect(service.create).toHaveBeenCalledWith(createOrderDto);
    });

    it('should handle service errors properly', async () => {
      const createOrderDto: CreateOrderDto = {
        userId: 999,
        shopId: 1,
        items: [
          {
            productId: 1,
            quantity: 1,
            price: 100,
            productName: 'Test Product',
            productSn: 'TEST001',
            productImage: 'test.jpg',
            productWeight: 1,
          },
        ],
        productAmount: 100,
        shippingFee: 0,
        discountAmount: 0,
        balance: 0,
        usePoints: 0,
        pointsAmount: 0,
        couponAmount: 0,
        totalAmount: 100,
        orderType: OrderType.NORMAL,
        consignee: 'Test User',
        mobile: '1234567890',
        address: 'Test Address',
        payTypeId: PayTypeId.ONLINE,
      };

      mockOrderService.create.mockRejectedValue(
        new NotFoundException('用户不存在'),
      );

      await expect(controller.create(createOrderDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      const queryDto: OrderQueryDto = {
        page: 1,
        size: 10,
        userId: 1,
      };

      const mockResult = {
        records: [
          { orderId: 1, orderSn: 'ORDER_001', userId: 1, totalAmount: 100 },
          { orderId: 2, orderSn: 'ORDER_002', userId: 1, totalAmount: 200 },
        ],
        total: 2,
        page: 1,
        size: 10,
        totalPages: 1,
      };

      mockOrderService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(queryDto);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('should handle default pagination parameters', async () => {
      const queryDto = {};
      const mockResult = {
        records: [],
        total: 0,
        page: 1,
        size: 15,
        totalPages: 0,
      };

      mockOrderService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(queryDto);

      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      const orderId = 1;
      const mockOrder = {
        orderId: 1,
        orderSn: 'ORDER_001',
        userId: 1,
        totalAmount: 100,
      };

      mockOrderService.findOne.mockResolvedValue(mockOrder);

      const result = await controller.findOne(orderId);

      expect(result).toEqual(mockOrder);
      expect(service.findOne).toHaveBeenCalledWith(orderId);
    });

    it('should handle NotFoundException', async () => {
      const orderId = 999;
      mockOrderService.findOne.mockRejectedValue(
        new NotFoundException('订单不存在'),
      );

      await expect(controller.findOne(orderId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update an order status successfully', async () => {
      const orderId = 1;
      const updateOrderDto: UpdateOrderDto = {
        status: OrderStatus.CONFIRMED,
      };

      const mockOrder = {
        orderId: 1,
        status: OrderStatus.CONFIRMED,
      };

      mockOrderService.updateStatus.mockResolvedValue(mockOrder);

      const result = await controller.updateStatus(orderId, updateOrderDto);

      expect(result).toEqual(mockOrder);
      expect(service.updateStatus).toHaveBeenCalledWith(orderId, updateOrderDto);
    });

    it('should handle NotFoundException', async () => {
      const orderId = 999;
      const updateOrderDto: UpdateOrderDto = { status: OrderStatus.CONFIRMED };

      mockOrderService.updateStatus.mockRejectedValue(
        new NotFoundException('订单不存在'),
      );

      await expect(controller.updateStatus(orderId, updateOrderDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete an order successfully', async () => {
      const orderId = 1;
      const mockResult = { message: '订单删除成功' };

      mockOrderService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove(orderId);

      expect(result).toEqual(mockResult);
      expect(service.remove).toHaveBeenCalledWith(orderId);
    });

    it('should handle NotFoundException', async () => {
      const orderId = 999;
      mockOrderService.remove.mockRejectedValue(
        new NotFoundException('订单不存在'),
      );

      await expect(controller.remove(orderId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order successfully', async () => {
      const orderId = 1;
      const cancelOrderDto: CancelOrderDto = {
        reason: 'User requested cancellation',
      };

      const mockOrder = {
        orderId: 1,
        status: OrderStatus.CANCELLED,
        cancelReason: 'User requested cancellation',
      };

      mockOrderService.cancel.mockResolvedValue(mockOrder);

      const result = await controller.cancelOrder(orderId, cancelOrderDto);

      expect(result).toEqual(mockOrder);
      expect(service.cancel).toHaveBeenCalledWith(orderId, cancelOrderDto.reason);
    });

    it('should handle BadRequestException', async () => {
      const orderId = 1;
      const cancelOrderDto: CancelOrderDto = {
        reason: 'User requested cancellation',
      };

      mockOrderService.cancel.mockRejectedValue(
        new BadRequestException('已支付的订单无法取消'),
      );

      await expect(controller.cancelOrder(orderId, cancelOrderDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getStatistics', () => {
    it('should return order statistics', async () => {
      const timeRange = 'day';
      const startDate = '2024-01-01';
      const endDate = '2024-01-02';

      const mockStats = [
        { date: '2024-01-01', totalAmount: 1000, orderCount: 10 },
        { date: '2024-01-02', totalAmount: 1500, orderCount: 15 },
      ];

      mockOrderService.getStatistics.mockResolvedValue(mockStats);

      const result = await controller.getStatistics(timeRange, startDate, endDate);

      expect(result).toEqual(mockStats);
      expect(service.getStatistics).toHaveBeenCalledWith(timeRange, startDate, endDate);
    });
  });

  describe('confirm', () => {
    it('should confirm an order successfully', async () => {
      const orderId = 1;
      const mockResult = { message: '订单确认成功' };

      mockOrderService.confirm.mockResolvedValue(mockResult);

      const result = await controller.confirm(orderId);

      expect(result).toEqual(mockResult);
      expect(service.confirm).toHaveBeenCalledWith(orderId);
    });
  });

  describe('ship', () => {
    it('should ship an order successfully', async () => {
      const orderId = 1;
      const shippingData = { trackingNo: 'TRACK123' };
      const mockResult = { message: '订单发货成功' };

      mockOrderService.ship.mockResolvedValue(mockResult);

      const result = await controller.ship(orderId, shippingData);

      expect(result).toEqual(mockResult);
      expect(service.ship).toHaveBeenCalledWith(orderId, shippingData);
    });
  });

  describe('receive', () => {
    it('should receive an order successfully', async () => {
      const orderId = 1;
      const mockResult = { message: '订单收货成功' };

      mockOrderService.receive.mockResolvedValue(mockResult);

      const result = await controller.receive(orderId);

      expect(result).toEqual(mockResult);
      expect(service.receive).toHaveBeenCalledWith(orderId);
    });
  });

  describe('restore', () => {
    it('should restore an order successfully', async () => {
      const orderId = 1;
      const mockResult = { message: '订单恢复成功' };

      mockOrderService.restore.mockResolvedValue(mockResult);

      const result = await controller.restore(orderId);

      expect(result).toEqual(mockResult);
      expect(service.restore).toHaveBeenCalledWith(orderId);
    });
  });

  describe('applyCoupon', () => {
    it('should apply coupon successfully', async () => {
      const applyCouponDto: ApplyCouponDto = {
        orderId: 1,
        code: 'TEST10',
      };

      const mockCoupon = {
        couponId: 1,
        couponCode: 'TEST10',
        discountAmount: 10,
      };

      mockCouponService.getCoupun.mockResolvedValue(mockCoupon);

      const result = await controller.applyCoupon(applyCouponDto);

      expect(result).toEqual({
        message: 'Coupon applied successfully',
      });
      expect(mockCouponService.getCoupun).toHaveBeenCalledWith(applyCouponDto);
    });

    it('should handle coupon errors', async () => {
      const applyCouponDto: ApplyCouponDto = {
        orderId: 1,
        code: 'INVALID',
      };

      const mockError = { error: { message: '优惠券不存在' } };
      mockCouponService.getCoupun.mockResolvedValue(mockError);

      await expect(controller.applyCoupon(applyCouponDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findMyOrders', () => {
    it('should return user orders with userId from request', async () => {
      const queryDto: OrderQueryDto = {
        page: 1,
        size: 10,
      };

      const mockRequest = {
        user: {
          userId: 1,
        },
      };

      const mockResult = {
        records: [
          { orderId: 1, orderSn: 'ORDER_001', userId: 1, totalAmount: 100 },
          { orderId: 2, orderSn: 'ORDER_002', userId: 1, totalAmount: 200 },
        ],
        total: 2,
        page: 1,
        size: 10,
        totalPages: 1,
      };

      mockOrderService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findMyOrders(queryDto, mockRequest as any);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith({
        ...queryDto,
        userId: 1,
      });
    });
  });
});