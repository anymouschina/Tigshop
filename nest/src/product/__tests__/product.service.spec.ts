// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from '../product.service';
import { DatabaseService } from '../../database/database.service';
import { CreateProductDto, CreateProductSpecDto, CreateProductAttrDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

// Mock the DatabaseService
const mockDatabaseService = {
  product: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  category: {
    findUnique: jest.fn(),
  },
  brand: {
    findUnique: jest.fn(),
  },
  supplier: {
    findUnique: jest.fn(),
  },
  productSpec: {
    deleteMany: jest.fn(),
    aggregate: jest.fn(),
    update: jest.fn(),
  },
  productAttr: {
    deleteMany: jest.fn(),
  },
};

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        price: 100,
        stock: 10,
        description: 'Test Description',
        categoryId: 1,
        specType: 0,
        minBuy: 1,
        sort: 100,
        specs: [
          {
            specName: 'Color',
            specValue: 'Red',
            specPrice: 100,
            specStock: 10,
            sort: 1,
          },
        ],
        attrs: [
          {
            attrName: 'Material',
            attrValue: 'Cotton',
            sort: 1,
          },
        ],
      };

      const mockCategory = { categoryId: 1, categoryName: 'Test Category' };
      const mockProduct = {
        productId: 1,
        name: 'Test Product',
        price: 100,
        stock: 10,
        description: 'Test Description',
        categoryId: 1,
        productSpecs: [],
        productAttrs: [],
      };

      mockDatabaseService.category.findUnique.mockResolvedValue(mockCategory);
      mockDatabaseService.product.create.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto);

      expect(result).toEqual(mockProduct);
      expect(mockDatabaseService.category.findUnique).toHaveBeenCalledWith({
        where: { categoryId: 1 },
      });
      expect(mockDatabaseService.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Test Product',
          price: 100,
          stock: 10,
          description: 'Test Description',
          categoryId: 1,
          shopId: 1,
          images: [],
          productSpecs: {
            create: [
              {
                specName: 'Color',
                specValue: 'Red',
                specPrice: 100,
                specStock: 10,
                sort: 1,
              },
            ],
          },
          productAttrs: {
            create: [
              {
                attrName: 'Material',
                attrValue: 'Cotton',
                sort: 1,
              },
            ],
          },
        }),
        include: expect.objectContaining({
          category: true,
          brand: true,
          supplier: true,
          shop: true,
          productSpecs: true,
          productAttrs: true,
        }),
      });
    });

    it('should throw BadRequestException when category does not exist', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        price: 100,
        stock: 10,
        description: 'Test Description',
        categoryId: 999,
        specType: 0,
        minBuy: 1,
        sort: 100,
      };

      mockDatabaseService.category.findUnique.mockResolvedValue(null);

      await expect(service.create(createProductDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle database errors gracefully', async () => {
      const createProductDto: CreateProductDto = {
        name: 'Test Product',
        price: 100,
        stock: 10,
        description: 'Test Description',
        categoryId: 1,
        specType: 0,
        minBuy: 1,
        sort: 100,
      };

      const mockCategory = { categoryId: 1, categoryName: 'Test Category' };
      mockDatabaseService.category.findUnique.mockResolvedValue(mockCategory);
      mockDatabaseService.product.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createProductDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const queryDto: ProductQueryDto = {
        page: 1,
        size: 10,
        keyword: 'test',
      };

      const mockProducts = [
        { productId: 1, name: 'Test Product 1', price: 100 },
        { productId: 2, name: 'Test Product 2', price: 200 },
      ];

      mockDatabaseService.product.findMany.mockResolvedValue(mockProducts);
      mockDatabaseService.product.count.mockResolvedValue(2);

      const result = await service.findAll(queryDto);

      expect(result).toEqual({
        records: mockProducts,
        total: 2,
        page: 1,
        size: 10,
        totalPages: 1,
      });
    });

    it('should apply keyword filter correctly', async () => {
      const queryDto: ProductQueryDto = {
        page: 1,
        size: 10,
        keyword: 'search term',
      };

      await service.findAll(queryDto);

      expect(mockDatabaseService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'search term', mode: 'insensitive' } },
              { subtitle: { contains: 'search term', mode: 'insensitive' } },
              { keywords: { contains: 'search term', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      const queryDto: ProductQueryDto = {
        page: 2,
        size: 5,
      };

      await service.findAll(queryDto);

      expect(mockDatabaseService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const productId = 1;
      const mockProduct = {
        productId: 1,
        name: 'Test Product',
        price: 100,
        isDeleted: false,
        productSpecs: [],
        productAttrs: [],
      };

      mockDatabaseService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne(productId);

      expect(result).toEqual(mockProduct);
      expect(mockDatabaseService.product.findUnique).toHaveBeenCalledWith({
        where: { productId: 1 },
        include: expect.objectContaining({
          category: true,
          brand: true,
          supplier: true,
          shop: true,
          productSpecs: expect.any(Object),
          productAttrs: expect.any(Object),
        }),
      });
    });

    it('should throw NotFoundException when product does not exist', async () => {
      const productId = 999;
      mockDatabaseService.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne(productId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when product is deleted', async () => {
      const productId = 1;
      const mockProduct = {
        productId: 1,
        name: 'Test Product',
        isDeleted: true,
      };

      mockDatabaseService.product.findUnique.mockResolvedValue(mockProduct);

      await expect(service.findOne(productId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      const productId = 1;
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
        price: 150,
      };

      const existingProduct = {
        productId: 1,
        name: 'Test Product',
        isDeleted: false,
      };

      const updatedProduct = {
        productId: 1,
        name: 'Updated Product',
        price: 150,
        productSpecs: [],
        productAttrs: [],
      };

      mockDatabaseService.product.findUnique.mockResolvedValue(existingProduct);
      mockDatabaseService.productSpec.deleteMany.mockResolvedValue({});
      mockDatabaseService.productAttr.deleteMany.mockResolvedValue({});
      mockDatabaseService.product.update.mockResolvedValue(updatedProduct);

      const result = await service.update(productId, updateProductDto);

      expect(result).toEqual(updatedProduct);
      expect(mockDatabaseService.product.update).toHaveBeenCalledWith({
        where: { productId: 1 },
        data: expect.objectContaining({
          name: 'Updated Product',
          price: 150,
        }),
        include: expect.objectContaining({
          category: true,
          brand: true,
          supplier: true,
          shop: true,
          productSpecs: true,
          productAttrs: true,
        }),
      });
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      const productId = 999;
      const updateProductDto: UpdateProductDto = { name: 'Updated Product' };

      mockDatabaseService.product.findUnique.mockResolvedValue(null);

      await expect(service.update(productId, updateProductDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when updating deleted product', async () => {
      const productId = 1;
      const updateProductDto: UpdateProductDto = { name: 'Updated Product' };

      const existingProduct = {
        productId: 1,
        name: 'Test Product',
        isDeleted: true,
      };

      mockDatabaseService.product.findUnique.mockResolvedValue(existingProduct);

      await expect(service.update(productId, updateProductDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a product', async () => {
      const productId = 1;
      const mockProduct = {
        productId: 1,
        name: 'Test Product',
        isDeleted: false,
      };

      mockDatabaseService.product.findUnique.mockResolvedValue(mockProduct);
      mockDatabaseService.product.update.mockResolvedValue({});

      const result = await service.remove(productId);

      expect(result).toEqual({ message: '商品删除成功' });
      expect(mockDatabaseService.product.update).toHaveBeenCalledWith({
        where: { productId: 1 },
        data: { isDeleted: true, deletedAt: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when deleting non-existent product', async () => {
      const productId = 999;
      mockDatabaseService.product.findUnique.mockResolvedValue(null);

      await expect(service.remove(productId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when deleting already deleted product', async () => {
      const productId = 1;
      const mockProduct = {
        productId: 1,
        name: 'Test Product',
        isDeleted: true,
      };

      mockDatabaseService.product.findUnique.mockResolvedValue(mockProduct);

      await expect(service.remove(productId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('restore', () => {
    it('should restore a deleted product', async () => {
      const productId = 1;
      const mockProduct = {
        productId: 1,
        name: 'Test Product',
        isDeleted: true,
      };

      mockDatabaseService.product.findUnique.mockResolvedValue(mockProduct);
      mockDatabaseService.product.update.mockResolvedValue({});

      const result = await service.restore(productId);

      expect(result).toEqual({ message: '商品恢复成功' });
      expect(mockDatabaseService.product.update).toHaveBeenCalledWith({
        where: { productId: 1 },
        data: { isDeleted: false, deletedAt: null },
      });
    });
  });

  describe('getStock', () => {
    it('should return product stock information', async () => {
      const productId = 1;
      const mockProduct = {
        productId: 1,
        name: 'Test Product',
        price: 100,
        stock: 50,
        productSpecs: [],
      };

      mockDatabaseService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.getStock(productId);

      expect(result).toEqual({
        productId: 1,
        stock: 50,
        price: 100,
      });
    });

    it('should return spec stock information when specId is provided', async () => {
      const productId = 1;
      const specId = 1;
      const mockProduct = {
        productId: 1,
        name: 'Test Product',
        price: 100,
        productSpecs: [
          {
            specId: 1,
            specName: 'Color',
            specValue: 'Red',
            specPrice: 120,
            specStock: 25,
          },
        ],
      };

      mockDatabaseService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.getStock(productId, specId);

      expect(result).toEqual({
        productId: 1,
        specId: 1,
        stock: 25,
        price: 120,
      });
    });
  });

  describe('updateStock', () => {
    it('should update product stock successfully', async () => {
      const productId = 1;
      const quantity = 10;
      const mockProduct = {
        productId: 1,
        name: 'Test Product',
        stock: 50,
      };

      mockDatabaseService.product.findUnique.mockResolvedValue(mockProduct);
      mockDatabaseService.product.update.mockResolvedValue({
        ...mockProduct,
        stock: 60,
      });

      const result = await service.updateStock(productId, quantity);

      expect(result).toEqual({ message: '库存更新成功' });
      expect(mockDatabaseService.product.update).toHaveBeenCalledWith({
        where: { productId: 1 },
        data: { stock: 60 },
      });
    });

    it('should throw BadRequestException when insufficient stock', async () => {
      const productId = 1;
      const quantity = -100;
      const mockProduct = {
        productId: 1,
        name: 'Test Product',
        stock: 50,
      };

      mockDatabaseService.product.findUnique.mockResolvedValue(mockProduct);

      await expect(service.updateStock(productId, quantity)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getHotProducts', () => {
    it('should return hot products', async () => {
      const limit = 5;
      const mockProducts = [
        { productId: 1, name: 'Hot Product 1', sales: 100 },
        { productId: 2, name: 'Hot Product 2', sales: 80 },
      ];

      mockDatabaseService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.getHotProducts(limit);

      expect(result).toEqual(mockProducts);
      expect(mockDatabaseService.product.findMany).toHaveBeenCalledWith({
        where: {
          isDeleted: false,
          isEnable: true,
          isHot: true,
        },
        orderBy: { sales: 'desc' },
        take: 5,
        include: expect.objectContaining({
          category: true,
          brand: true,
        }),
      });
    });
  });

  describe('getRecommendedProducts', () => {
    it('should return recommended products', async () => {
      const limit = 10;
      const mockProducts = [
        { productId: 1, name: 'Recommended Product 1' },
        { productId: 2, name: 'Recommended Product 2' },
      ];

      mockDatabaseService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.getRecommendedProducts(limit);

      expect(result).toEqual(mockProducts);
      expect(mockDatabaseService.product.findMany).toHaveBeenCalledWith({
        where: {
          isDeleted: false,
          isEnable: true,
          isRecommend: true,
        },
        orderBy: { sort: 'asc' },
        take: 10,
        include: expect.objectContaining({
          category: true,
          brand: true,
        }),
      });
    });
  });

  describe('getNewProducts', () => {
    it('should return new products', async () => {
      const limit = 8;
      const mockProducts = [
        { productId: 1, name: 'New Product 1', createdAt: new Date() },
        { productId: 2, name: 'New Product 2', createdAt: new Date() },
      ];

      mockDatabaseService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.getNewProducts(limit);

      expect(result).toEqual(mockProducts);
      expect(mockDatabaseService.product.findMany).toHaveBeenCalledWith({
        where: {
          isDeleted: false,
          isEnable: true,
          isNew: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: expect.objectContaining({
          category: true,
          brand: true,
        }),
      });
    });
  });

  describe('search', () => {
    it('should search products by keyword', async () => {
      const keyword = 'search term';
      const limit = 20;
      const mockProducts = [
        { productId: 1, name: 'Search Result 1' },
        { productId: 2, name: 'Search Result 2' },
      ];

      mockDatabaseService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.search(keyword, limit);

      expect(result).toEqual(mockProducts);
      expect(mockDatabaseService.product.findMany).toHaveBeenCalledWith({
        where: {
          isDeleted: false,
          isEnable: true,
          OR: [
            { name: { contains: keyword, mode: 'insensitive' } },
            { subtitle: { contains: keyword, mode: 'insensitive' } },
            { keywords: { contains: keyword, mode: 'insensitive' } },
          ],
        },
        orderBy: { sort: 'asc' },
        take: 20,
        include: expect.objectContaining({
          category: true,
          brand: true,
        }),
      });
    });
  });
});
