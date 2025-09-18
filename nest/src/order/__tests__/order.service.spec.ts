import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '../order.service';
import { DatabaseService } from '../../database/database.service';
import { CreateOrderDto, OrderStatus, ShippingStatus, PayStatus, OrderType, PayTypeId } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { OrderQueryDto } from '../dto/order-query.dto';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

// Mock the DatabaseService
const mockDatabaseService = {
  user: {
    findUnique: jest.fn(),
  },
  order: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  orderItem: {
    createMany: jest.fn(),
  },
  orderAddress: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
  $queryRawUnsafe: jest.fn(),
};

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

      const mockUser = { userId: 1, name: 'Test User' };
      const mockProduct = { productId: 1, name: 'Test Product', stock: 50 };
      const mockOrder = {
        orderId: 1,
        orderSn: 'ORDER_123456',
        userId: 1,
        totalAmount: 210,
        status: OrderStatus.PENDING,
        paymentStatus: PayStatus.UNPAID,
        shippingStatus: ShippingStatus.PENDING,
      };

      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);
      mockDatabaseService.product.findUnique.mockResolvedValue(mockProduct);
      mockDatabaseService.$transaction.mockImplementation(async (callback) => {
        const tx = {
          order: { create: jest.fn().mockResolvedValue(mockOrder) },
          orderItem: { createMany: jest.fn().mockResolvedValue({}) },
          orderAddress: { create: jest.fn().mockResolvedValue({}) },
          product: { update: jest.fn().mockResolvedValue({}) },
        };
        return await callback(tx);
      });

      const result = await service.create(createOrderDto);

      expect(result).toEqual(mockOrder);
      expect(mockDatabaseService.user.findUnique).toHaveBeenCalledWith({
        where: { userId: 1 },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const createOrderDto: CreateOrderDto = {
        userId: 999,
        shopId: 1,
        items: [{ productId: 1, quantity: 1, price: 100, productName: 'Test Product', productSn: 'TEST001', productImage: 'test.jpg', productWeight: 1 }],
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

      mockDatabaseService.user.findUnique.mockResolvedValue(null);

      await expect(service.create(createOrderDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when insufficient stock', async () => {
      const createOrderDto: CreateOrderDto = {
        userId: 1,
        shopId: 1,
        items: [{ productId: 1, quantity: 10, price: 100, productName: 'Test Product', productSn: 'TEST001', productImage: 'test.jpg', productWeight: 1 }],
        productAmount: 1000,
        shippingFee: 0,
        discountAmount: 0,
        balance: 0,
        usePoints: 0,
        pointsAmount: 0,
        couponAmount: 0,
        totalAmount: 1000,
        orderType: OrderType.NORMAL,
        consignee: 'Test User',
        mobile: '1234567890',
        address: 'Test Address',
        payTypeId: PayTypeId.ONLINE,
      };

      const mockUser = { userId: 1, name: 'Test User' };
      const mockProduct = { productId: 1, name: 'Test Product', stock: 5 };

      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);
      mockDatabaseService.product.findUnique.mockResolvedValue(mockProduct);

      await expect(service.create(createOrderDto)).rejects.toThrow(
        ConflictException,
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

      const mockOrders = [
        { orderId: 1, orderSn: 'ORDER_001', userId: 1, totalAmount: 100 },
        { orderId: 2, orderSn: 'ORDER_002', userId: 1, totalAmount: 200 },
      ];

      mockDatabaseService.order.findMany.mockResolvedValue(mockOrders);
      mockDatabaseService.order.count.mockResolvedValue(2);

      const result = await service.findAll(queryDto);

      expect(result).toEqual({
        records: mockOrders,
        total: 2,
        page: 1,
        size: 10,
        totalPages: 1,
      });
    });

    it('should apply filters correctly', async () => {
      const queryDto: OrderQueryDto = {
        page: 1,
        size: 10,
        userId: 1,
        status: OrderStatus.PENDING,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      await service.findAll(queryDto);

      expect(mockDatabaseService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 1,
            status: OrderStatus.PENDING,
            createdAt: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            },
          }),
        }),
      );
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
        items: [],
        address: {},
      };

      mockDatabaseService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findOne(orderId);

      expect(result).toEqual(mockOrder);
      expect(mockDatabaseService.order.findUnique).toHaveBeenCalledWith({
        where: { orderId: 1 },
        include: expect.objectContaining({
          items: expect.objectContaining({
            include: {
              product: true,
            },
          }),
          addresses: true,
          user: true,
        }),
      });
    });

    it('should throw NotFoundException when order does not exist', async () => {
      const orderId = 999;
      mockDatabaseService.order.findUnique.mockResolvedValue(null);

      await expect(service.findOne(orderId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update an order status successfully', async () => {
      const orderId = 1;
      const updateOrderDto: UpdateOrderDto = {
        status: OrderStatus.CONFIRMED,
      };

      const existingOrder = {
        orderId: 1,
        status: OrderStatus.PENDING,
      };

      const updatedOrder = {
        orderId: 1,
        status: OrderStatus.CONFIRMED,
      };

      mockDatabaseService.order.findUnique.mockResolvedValue(existingOrder);
      mockDatabaseService.order.update.mockResolvedValue(updatedOrder);

      const result = await service.updateStatus(orderId, updateOrderDto);

      expect(result).toEqual(updatedOrder);
      expect(mockDatabaseService.order.update).toHaveBeenCalledWith({
        where: { orderId: 1 },
        data: {
          status: OrderStatus.CONFIRMED,
          paymentStatus: undefined,
          shippingStatus: undefined,
          paymentTime: null,
          shippingTime: null,
          receiveTime: null,
          completeTime: null,
        },
        include: expect.objectContaining({
          items: true,
          addresses: true,
          user: true,
        }),
      });
    });

    it('should throw NotFoundException when updating non-existent order', async () => {
      const orderId = 999;
      const updateOrderDto: UpdateOrderDto = { status: OrderStatus.CONFIRMED };

      mockDatabaseService.order.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus(orderId, updateOrderDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('should cancel an order successfully', async () => {
      const orderId = 1;
      const cancelReason = 'User requested cancellation';

      const existingOrder = {
        orderId: 1,
        status: OrderStatus.PENDING,
        paymentStatus: PayStatus.UNPAID,
      };

      const updatedOrder = {
        orderId: 1,
        status: OrderStatus.CANCELLED,
        cancelReason,
        cancelTime: expect.any(Date),
      };

      mockDatabaseService.order.findUnique.mockResolvedValue(existingOrder);
      mockDatabaseService.order.update.mockResolvedValue(updatedOrder);

      const result = await service.cancel(orderId, cancelReason);

      expect(result).toEqual(updatedOrder);
    });

    it('should throw BadRequestException when cancelling paid order', async () => {
      const orderId = 1;
      const cancelReason = 'User requested cancellation';

      const existingOrder = {
        orderId: 1,
        status: OrderStatus.PENDING,
        paymentStatus: 'PAID', // This matches PrismaPaymentStatus.PAID
      };

      mockDatabaseService.order.findUnique.mockResolvedValue(existingOrder);

      await expect(service.cancel(orderId, cancelReason)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getStatistics', () => {
    it('should return order statistics', async () => {
      const mockStats = [
        { date: '2024-01-01', totalAmount: 1000, orderCount: 10 },
        { date: '2024-01-02', totalAmount: 1500, orderCount: 15 },
      ];

      mockDatabaseService.$queryRawUnsafe.mockResolvedValue(mockStats);

      const result = await service.getStatistics('day', '2024-01-01', '2024-01-02');

      expect(result).toEqual(mockStats);
    });
  });
});