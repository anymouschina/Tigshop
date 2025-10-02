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
});
