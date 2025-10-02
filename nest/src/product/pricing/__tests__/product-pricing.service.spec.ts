// @ts-nocheck
import { Test, TestingModule } from "@nestjs/testing";
import { ProductPricingService } from "../product-pricing.service";
import { PrismaService } from "src/prisma/prisma.service";

describe("ProductPricingService", () => {
  let service: ProductPricingService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const prismaMock = {
      product: {
        findFirst: jest.fn(),
      },
      product_sku: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductPricingService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ProductPricingService>(ProductPricingService);
    prisma = module.get(PrismaService);
  });

  describe("getAvailability", () => {
    it("returns product-level price/stock when skuId is not provided", async () => {
      prisma.product.findFirst.mockResolvedValue({
        product_price: 99.99,
        market_price: 129.99,
        product_stock: 50,
      });

      const res = await service.getAvailability({ productId: 1001 });
      expect(res).toEqual({
        stock: 50,
        priceStr: "99.99",
        originPriceStr: "129.99",
        priceNum: 99.99,
        originPriceNum: 129.99,
      });
      expect(prisma.product.findFirst).toHaveBeenCalledWith({
        where: { product_id: 1001 },
        select: { product_price: true, market_price: true, product_stock: true },
      });
    });

    it("returns sku-level price/stock when skuId is provided", async () => {
      prisma.product.findFirst.mockResolvedValue({
        product_price: 99.99,
        market_price: 129.99,
        product_stock: 50,
      });
      prisma.product_sku.findFirst.mockResolvedValue({
        sku_stock: 3,
        sku_price: 12.34,
      });

      const res = await service.getAvailability({ productId: 1001, skuId: 2002 });
      expect(res).toEqual({
        stock: 3,
        priceStr: "12.34",
        originPriceStr: "129.99",
        priceNum: 12.34,
        originPriceNum: 129.99,
      });
      expect(prisma.product_sku.findFirst).toHaveBeenCalledWith({
        where: { product_id: 1001, sku_id: 2002 },
        select: { sku_stock: true, sku_price: true },
      });
    });
  });

  describe("getAmount", () => {
    it("sums total for valid skus and ignores invalid ones", async () => {
      // Mock behavior: return price for skuId=1, null for others
      prisma.product_sku.findFirst.mockImplementation(async (args: any) => {
        if (args?.where?.sku_id === 1) return { sku_price: 10 };
        return null;
      });

      const res = await service.getAmount(1001, [
        { skuId: 1, num: 2 }, // valid -> 2 * 10 = 20
        { skuId: 999, num: 5 }, // invalid -> ignored
      ]);

      expect(res).toEqual({ count: 7, totalStr: "20.00", totalNum: 20 });
      expect(prisma.product_sku.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  describe("getBatchAvailability", () => {
    it("returns map of skuId to price/stock for provided ids", async () => {
      prisma.product_sku.findMany.mockResolvedValue([
        { sku_id: 1, sku_price: 9.5, sku_stock: 8 },
        { sku_id: 2, sku_price: 19, sku_stock: 0 },
      ]);

      const res = await service.getBatchAvailability([1, 2]);
      expect(res).toEqual({
        "1": { price: "9.50", stock: 8 },
        "2": { price: "19.00", stock: 0 },
      });
      expect(prisma.product_sku.findMany).toHaveBeenCalledWith({
        where: { sku_id: { in: [1, 2] } },
        select: { sku_id: true, sku_price: true, sku_stock: true },
      });
    });
  });

  describe("getPriceInBatches", () => {
    it("returns combined origin price, sku price and stock per item", async () => {
      prisma.product.findFirst
        .mockResolvedValueOnce({ market_price: 50, product_price: 40, product_stock: 100 })
        .mockResolvedValueOnce({ market_price: 30, product_price: 25, product_stock: 10 });

      prisma.product_sku.findFirst
        .mockResolvedValueOnce({ sku_price: 35, sku_stock: 5 }) // for first item
        .mockResolvedValueOnce(null); // for second item, fallback to product

      const res = await service.getPriceInBatches([
        { productId: 101, skuId: 1001 },
        { productId: 202, skuId: 2002 },
      ]);

      expect(res).toEqual([
        {
          origin_price: 50,
          price: 35,
          stock: 5,
          promotion: null,
          sku_id: 1001,
          product_id: 101,
        },
        {
          origin_price: 30,
          price: 25,
          stock: 10,
          promotion: null,
          sku_id: 2002,
          product_id: 202,
        },
      ]);
    });
  });
});
