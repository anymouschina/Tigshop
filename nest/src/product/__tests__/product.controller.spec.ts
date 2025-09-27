// @ts-nocheck
import { Test, TestingModule } from "@nestjs/testing";
import { ProductController } from "../product.controller";
import { ProductService } from "../product.service";
import {
  CreateProductDto,
  CreateProductSpecDto,
  CreateProductAttrDto,
} from "../dto/create-product.dto";
import { UpdateProductDto } from "../dto/update-product.dto";
import { ProductQueryDto } from "../dto/product-query.dto";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";

// Mock the ProductService
const mockProductService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  restore: jest.fn(),
  getStock: jest.fn(),
  updateStock: jest.fn(),
  getHotProducts: jest.fn(),
  getRecommendedProducts: jest.fn(),
  getNewProducts: jest.fn(),
  search: jest.fn(),
};

describe("ProductController", () => {
  let controller: ProductController;
  let service: ProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductController>(ProductController);
    service = module.get<ProductService>(ProductService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("create", () => {
    it("should create a product successfully", async () => {
      const createProductDto: CreateProductDto = {
        name: "Test Product",
        price: 100,
        stock: 10,
        description: "Test Description",
        categoryId: 1,
        specType: 0,
        minBuy: 1,
        sort: 100,
      };

      const mockProduct = {
        productId: 1,
        name: "Test Product",
        price: 100,
        stock: 10,
        description: "Test Description",
        categoryId: 1,
      };

      mockProductService.create.mockResolvedValue(mockProduct);

      const result = await controller.create(createProductDto, {
        user: { userId: 1 },
      });

      expect(result).toEqual(mockProduct);
      expect(service.create).toHaveBeenCalledWith(createProductDto, 1);
    });

    it("should handle service errors properly", async () => {
      const createProductDto: CreateProductDto = {
        name: "Test Product",
        price: 100,
        stock: 10,
        description: "Test Description",
        categoryId: 1,
        specType: 0,
        minBuy: 1,
        sort: 100,
      };

      mockProductService.create.mockRejectedValue(
        new BadRequestException("Category not found"),
      );

      await expect(
        controller.create(createProductDto, { user: { userId: 1 } }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("should return paginated products", async () => {
      const queryDto: ProductQueryDto = {
        page: 1,
        size: 10,
        keyword: "test",
      };

      const mockResult = {
        records: [
          { productId: 1, name: "Test Product 1", price: 100 },
          { productId: 2, name: "Test Product 2", price: 200 },
        ],
        total: 2,
        page: 1,
        size: 10,
        totalPages: 1,
      };

      mockProductService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(queryDto);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });

    it("should handle default pagination parameters", async () => {
      const queryDto = {};
      const mockResult = {
        records: [],
        total: 0,
        page: 1,
        size: 15,
        totalPages: 0,
      };

      mockProductService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(queryDto);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });
  });

  describe("findOne", () => {
    it("should return a product by id", async () => {
      const productId = 1;
      const mockProduct = {
        productId: 1,
        name: "Test Product",
        price: 100,
        description: "Test Description",
      };

      mockProductService.findOne.mockResolvedValue(mockProduct);

      const result = await controller.findOne(productId);

      expect(result).toEqual(mockProduct);
      expect(service.findOne).toHaveBeenCalledWith(productId);
    });

    it("should handle NotFoundException", async () => {
      const productId = 999;
      mockProductService.findOne.mockRejectedValue(
        new NotFoundException("Product not found"),
      );

      await expect(controller.findOne(productId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("should update a product successfully", async () => {
      const productId = 1;
      const updateProductDto: UpdateProductDto = {
        name: "Updated Product",
        price: 150,
      };

      const mockProduct = {
        productId: 1,
        name: "Updated Product",
        price: 150,
      };

      mockProductService.update.mockResolvedValue(mockProduct);

      const result = await controller.update(productId, updateProductDto);

      expect(result).toEqual(mockProduct);
      expect(service.update).toHaveBeenCalledWith(productId, updateProductDto);
    });

    it("should handle NotFoundException", async () => {
      const productId = 999;
      const updateProductDto: UpdateProductDto = { name: "Updated Product" };

      mockProductService.update.mockRejectedValue(
        new NotFoundException("Product not found"),
      );

      await expect(
        controller.update(productId, updateProductDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should delete a product successfully", async () => {
      const productId = 1;
      const mockResult = { message: "商品删除成功" };

      mockProductService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove(productId);

      expect(result).toEqual(mockResult);
      expect(service.remove).toHaveBeenCalledWith(productId);
    });

    it("should handle NotFoundException", async () => {
      const productId = 999;
      mockProductService.remove.mockRejectedValue(
        new NotFoundException("Product not found"),
      );

      await expect(controller.remove(productId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("restore", () => {
    it("should restore a deleted product successfully", async () => {
      const productId = 1;
      const mockResult = { message: "商品恢复成功" };

      mockProductService.restore.mockResolvedValue(mockResult);

      const result = await controller.restore(productId);

      expect(result).toEqual(mockResult);
      expect(service.restore).toHaveBeenCalledWith(productId);
    });
  });

  describe("getStock", () => {
    it("should return product stock information", async () => {
      const productId = 1;
      const mockStock = {
        productId: 1,
        stock: 50,
        price: 100,
      };

      mockProductService.getStock.mockResolvedValue(mockStock);

      const result = await controller.getStock(productId);

      expect(result).toEqual(mockStock);
      expect(service.getStock).toHaveBeenCalledWith(productId, undefined);
    });

    it("should return spec stock information when specId is provided", async () => {
      const productId = 1;
      const specId = 1;
      const mockStock = {
        productId: 1,
        specId: 1,
        stock: 25,
        price: 120,
      };

      mockProductService.getStock.mockResolvedValue(mockStock);

      const result = await controller.getStock(productId, specId);

      expect(result).toEqual(mockStock);
      expect(service.getStock).toHaveBeenCalledWith(productId, specId);
    });
  });

  describe("updateStock", () => {
    it("should update product stock successfully", async () => {
      const productId = 1;
      const mockResult = { message: "库存更新成功" };

      mockProductService.updateStock.mockResolvedValue(mockResult);

      const result = await controller.updateStock(productId, { quantity: 10 });

      expect(result).toEqual(mockResult);
      expect(service.updateStock).toHaveBeenCalledWith(
        productId,
        10,
        undefined,
      );
    });
  });

  describe("getHotProducts", () => {
    it("should return hot products", async () => {
      const limit = 10;
      const mockProducts = [
        { productId: 1, name: "Hot Product 1", sales: 100 },
        { productId: 2, name: "Hot Product 2", sales: 80 },
      ];

      mockProductService.getHotProducts.mockResolvedValue(mockProducts);

      const result = await controller.getHotProducts(limit);

      expect(result).toEqual(mockProducts);
      expect(service.getHotProducts).toHaveBeenCalledWith(limit);
    });

    it("should use default limit when not provided", async () => {
      const mockProducts = [];
      mockProductService.getHotProducts.mockResolvedValue(mockProducts);

      await controller.getHotProducts();

      expect(service.getHotProducts).toHaveBeenCalledWith(10);
    });
  });

  describe("getRecommendedProducts", () => {
    it("should return recommended products", async () => {
      const limit = 8;
      const mockProducts = [
        { productId: 1, name: "Recommended Product 1" },
        { productId: 2, name: "Recommended Product 2" },
      ];

      mockProductService.getRecommendedProducts.mockResolvedValue(mockProducts);

      const result = await controller.getRecommendedProducts(limit);

      expect(result).toEqual(mockProducts);
      expect(service.getRecommendedProducts).toHaveBeenCalledWith(limit);
    });
  });

  describe("getNewProducts", () => {
    it("should return new products", async () => {
      const limit = 5;
      const mockProducts = [
        { productId: 1, name: "New Product 1", createdAt: new Date() },
        { productId: 2, name: "New Product 2", createdAt: new Date() },
      ];

      mockProductService.getNewProducts.mockResolvedValue(mockProducts);

      const result = await controller.getNewProducts(limit);

      expect(result).toEqual(mockProducts);
      expect(service.getNewProducts).toHaveBeenCalledWith(limit);
    });
  });

  describe("search", () => {
    it("should search products by keyword", async () => {
      const keyword = "search term";
      const mockProducts = [
        { productId: 1, name: "Search Result 1" },
        { productId: 2, name: "Search Result 2" },
      ];

      mockProductService.search.mockResolvedValue(mockProducts);

      const result = await controller.search(keyword);

      expect(result).toEqual(mockProducts);
      expect(service.search).toHaveBeenCalledWith(keyword, 20);
    });

    it("should throw BadRequestException for empty keyword", async () => {
      const keyword = "";

      await expect(controller.search(keyword)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should handle service errors during search", async () => {
      const keyword = "search term";
      mockProductService.search.mockRejectedValue(
        new BadRequestException("Search failed"),
      );

      await expect(controller.search(keyword)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
