// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';
import { DatabaseService } from '../../database/database.service';
import { OrderService } from '../../order/order.service';
import { AppConfigService } from '../../config/config.service';
import { AuthService } from '../../auth/auth.service';
import { EmailVerificationService } from '../services/email-verification.service';
import { WxLoginDto } from '../dto/wx-login.dto';
import { EmailRegisterDto } from '../dto/email-register.dto';
import { EmailLoginDto } from '../dto/email-login.dto';
import { LoginDto } from '../dto/login.dto';
import { ReferralDto } from '../dto/referral.dto';
import { CreateReferralCodeDto } from '../dto/create-referral-code.dto';
import { HttpException, HttpStatus, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('UserService', () => {
  let service: UserService;
  let databaseService: jest.Mocked<DatabaseService>;
  let orderService: jest.Mocked<OrderService>;
  let configService: jest.Mocked<AppConfigService>;
  let authService: jest.Mocked<AuthService>;
  let emailVerificationService: jest.Mocked<EmailVerificationService>;

  const mockDatabaseService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    userReferral: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    referralCode: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockOrderService = {
    findOne: jest.fn(),
  };

  const mockConfigService = {
    wechatAppId: 'test_app_id',
    wechatAppSecret: 'test_app_secret',
  };

  const mockAuthService = {
    generateToken: jest.fn(),
    hashPassword: jest.fn(),
    validatePassword: jest.fn(),
  };

  const mockEmailVerificationService = {
    verifyCode: jest.fn(),
    markEmailAsVerified: jest.fn(),
    clearVerificationCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: OrderService,
          useValue: mockOrderService,
        },
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: EmailVerificationService,
          useValue: mockEmailVerificationService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    databaseService = module.get(DatabaseService) as jest.Mocked<DatabaseService>;
    orderService = module.get(OrderService) as jest.Mocked<OrderService>;
    configService = module.get(AppConfigService) as jest.Mocked<AppConfigService>;
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
    emailVerificationService = module.get(EmailVerificationService) as jest.Mocked<EmailVerificationService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrders', () => {
    it('should return error when user not found', async () => {
      const userId = 1;
      mockDatabaseService.user.findUnique.mockResolvedValue(null);

      const result = await service.getOrders(userId);

      expect(result).toEqual({ error: { message: 'User was not found' } });
      expect(mockDatabaseService.user.findUnique).toHaveBeenCalledWith({ where: { userId } });
    });

    it('should return user orders', async () => {
      const userId = 1;
      const mockUser = { userId, name: 'Test User' };
      const mockOrders = [
        { orderId: 1, userId, orderSn: 'ORD001' },
        { orderId: 2, userId, orderSn: 'ORD002' },
      ];
      const mockOrderDetails = { orderId: 1, totalAmount: 100 };

      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);
      mockDatabaseService.order.findMany.mockResolvedValue(mockOrders);
      mockOrderService.findOne.mockResolvedValue(mockOrderDetails);

      const result = await service.getOrders(userId);

      expect(result).toHaveLength(2);
      expect(mockDatabaseService.order.findMany).toHaveBeenCalledWith({ where: { userId } });
      expect(mockOrderService.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('wxLogin', () => {
    const mockWxLoginDto: WxLoginDto = {
      code: 'test_code',
      userInfo: {
        nickName: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        gender: 1,
        country: 'China',
        province: 'Guangdong',
        city: 'Shenzhen',
        language: 'zh',
      },
      errMsg: 'success',
    };

    it('should throw error when WeChat config is missing', async () => {
      jest.spyOn(configService, 'wechatAppId', 'get').mockReturnValue('default_app_id');

      await expect(service.wxLogin(mockWxLoginDto)).rejects.toThrow(
        new HttpException('WeChat configuration is missing', HttpStatus.INTERNAL_SERVER_ERROR)
      );
    });

    it('should throw error when WeChat API returns error', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { errcode: 40013, errmsg: 'invalid appid' },
      });

      await expect(service.wxLogin(mockWxLoginDto)).rejects.toThrow(
        new HttpException('WeChat API error: invalid appid', HttpStatus.BAD_REQUEST)
      );
    });

    it('should create new user when not exists', async () => {
      const mockWxResponse = {
        data: { openid: 'test_openid', session_key: 'test_session_key' },
      };
      const mockUser = {
        userId: 1,
        name: 'Test User',
        email: 'wx_test_openid@example.com',
        openId: 'test_openid',
      };

      mockedAxios.get.mockResolvedValue(mockWxResponse);
      mockDatabaseService.user.findUnique.mockResolvedValue(null);
      mockDatabaseService.user.create.mockResolvedValue(mockUser);
      mockAuthService.generateToken.mockResolvedValue('test_token');

      const result = await service.wxLogin(mockWxLoginDto);

      expect(result).toEqual({
        user: {
          userId: mockUser.userId,
          name: mockUser.name,
          avatarUrl: mockWxLoginDto.userInfo.avatarUrl,
          wechatMetadata: {
            openId: 'test_openid',
            gender: mockWxLoginDto.userInfo.gender,
            country: mockWxLoginDto.userInfo.country,
            province: mockWxLoginDto.userInfo.province,
            city: mockWxLoginDto.userInfo.city,
          },
        },
        token: 'test_token',
      });
      expect(mockDatabaseService.user.create).toHaveBeenCalled();
    });

    it('should update existing user when userInfo provided', async () => {
      const mockWxResponse = {
        data: { openid: 'test_openid', session_key: 'test_session_key' },
      };
      const existingUser = {
        userId: 1,
        name: 'Old Name',
        email: 'wx_test_openid@example.com',
        openId: 'test_openid',
      };
      const updatedUser = {
        ...existingUser,
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      mockedAxios.get.mockResolvedValue(mockWxResponse);
      mockDatabaseService.user.findUnique.mockResolvedValue(existingUser);
      mockDatabaseService.user.update.mockResolvedValue(updatedUser);
      mockAuthService.generateToken.mockResolvedValue('test_token');

      const result = await service.wxLogin(mockWxLoginDto);

      expect(result.user.name).toBe('Test User');
      expect(mockDatabaseService.user.update).toHaveBeenCalled();
    });
  });

  describe('referralUser', () => {
    const mockReferralDto: ReferralDto = {
      refCode: 'test_ref_code',
      source: 'test_source',
    };

    it('should throw error when user not found', async () => {
      const userId = 1;
      mockDatabaseService.user.findUnique.mockResolvedValue(null);

      await expect(service.referralUser(userId, mockReferralDto)).rejects.toThrow(
        new NotFoundException('用户不存在')
      );
    });

    it('should throw error when user has no openId', async () => {
      const userId = 1;
      const mockUser = { userId: 1, openId: null };
      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.referralUser(userId, mockReferralDto)).rejects.toThrow(
        new BadRequestException('当前用户没有关联微信账号')
      );
    });

    it('should return error when user already has referral', async () => {
      const userId = 1;
      const mockUser = { userId: 1, openId: 'test_openid' };
      const existingReferral = { id: 1, userId, refCode: 'existing_code' };

      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);
      mockDatabaseService.userReferral.findUnique.mockResolvedValue(existingReferral);

      const result = await service.referralUser(userId, mockReferralDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('您已经关联过引荐人，不能重复关联');
    });

    it('should create referral successfully', async () => {
      const userId = 1;
      const mockUser = { userId: 1, openId: 'test_openid' };
      const referrerUser = { userId: 2, openId: 'referrer_openid' };
      const newReferral = { id: 1, userId, refCode: 'test_ref_code' };

      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);
      mockDatabaseService.userReferral.findUnique.mockResolvedValue(null);
      mockDatabaseService.user.findFirst.mockResolvedValue(referrerUser);
      mockDatabaseService.userReferral.create.mockResolvedValue(newReferral);

      const result = await service.referralUser(userId, mockReferralDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('引荐人关联成功');
      expect(mockDatabaseService.userReferral.create).toHaveBeenCalled();
    });

    it('should throw error when user tries to refer themselves', async () => {
      const userId = 1;
      const mockUser = { userId: 1, openId: 'test_openid' };
      const referrerUser = { userId: 1, openId: 'test_openid' };

      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);
      mockDatabaseService.userReferral.findUnique.mockResolvedValue(null);
      mockDatabaseService.user.findFirst.mockResolvedValue(referrerUser);

      await expect(service.referralUser(userId, mockReferralDto)).rejects.toThrow(
        new BadRequestException('不能使用自己的引荐码')
      );
    });
  });

  describe('getReferralStats', () => {
    it('should throw error when user not found', async () => {
      const userId = 1;
      mockDatabaseService.user.findUnique.mockResolvedValue(null);

      await expect(service.getReferralStats(userId)).rejects.toThrow(
        new NotFoundException('未找到用户或用户未关联微信账号')
      );
    });

    it('should return referral stats for user', async () => {
      const userId = 1;
      const mockUser = { userId: 1, openId: 'test_openid' };
      const mockReferrals = [
        { userId: 2, refCode: 'test_openid' },
        { userId: 3, refCode: 'test_openid' },
      ];
      const mockOrders = [{ userId: 2 }];

      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);
      mockDatabaseService.userReferral.findMany.mockResolvedValue(mockReferrals);
      mockDatabaseService.order.groupBy.mockResolvedValue(mockOrders);

      const result = await service.getReferralStats(userId);

      expect(result.success).toBe(true);
      expect(result.data.stats).toHaveLength(1);
      expect(result.data.total).toBe(2);
      expect(result.data.totalOrdered).toBe(1);
    });

    it('should return empty stats when no referrals', async () => {
      const userId = 1;
      const mockUser = { userId: 1, openId: 'test_openid' };

      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);
      mockDatabaseService.userReferral.findMany.mockResolvedValue([]);

      const result = await service.getReferralStats(userId);

      expect(result.success).toBe(true);
      expect(result.data.stats).toHaveLength(1);
      expect(result.data.total).toBe(0);
    });
  });

  describe('createReferralCode', () => {
    const mockCreateReferralCodeDto: CreateReferralCodeDto = {
      refCode: 'TEST_CODE',
      description: 'Test referral code',
    };

    it('should throw error when refCode is empty', async () => {
      const invalidDto = { ...mockCreateReferralCodeDto, refCode: '' };

      await expect(service.createReferralCode(invalidDto)).rejects.toThrow(
        new HttpException('引荐码不能为空', HttpStatus.BAD_REQUEST)
      );
    });

    it('should return error when refCode already exists', async () => {
      const existingCode = { id: 1, code: 'TEST_CODE' };
      mockDatabaseService.referralCode.findUnique.mockResolvedValue(existingCode);

      const result = await service.createReferralCode(mockCreateReferralCodeDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('引荐码已存在');
    });

    it('should create referral code successfully', async () => {
      mockDatabaseService.referralCode.findUnique.mockResolvedValue(null);
      const newReferralCode = { id: 1, code: 'TEST_CODE', description: 'Test referral code' };
      mockDatabaseService.referralCode.create.mockResolvedValue(newReferralCode);

      const result = await service.createReferralCode(mockCreateReferralCodeDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('引荐码创建成功');
      expect(result.data).toEqual(newReferralCode);
    });
  });

  describe('emailRegister', () => {
    const mockEmailRegisterDto: EmailRegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      code: '123456',
      referralCode: 'test_ref_code',
    };

    it('should throw error when verification code is invalid', async () => {
      mockEmailVerificationService.verifyCode.mockResolvedValue({
        success: false,
        message: '验证码无效',
      });

      await expect(service.emailRegister(mockEmailRegisterDto)).rejects.toThrow(
        new BadRequestException('验证码无效')
      );
    });

    it('should throw error when email already registered', async () => {
      mockEmailVerificationService.verifyCode.mockResolvedValue({
        success: true,
        message: '验证码有效',
      });
      mockDatabaseService.user.findUnique.mockResolvedValue({ userId: 1, email: 'test@example.com' });

      await expect(service.emailRegister(mockEmailRegisterDto)).rejects.toThrow(
        new BadRequestException('邮箱已注册')
      );
    });

    it('should register user successfully', async () => {
      mockEmailVerificationService.verifyCode.mockResolvedValue({
        success: true,
        message: '验证码有效',
      });
      mockDatabaseService.user.findUnique.mockResolvedValue(null);
      mockDatabaseService.user.findFirst.mockResolvedValue({ userId: 2, openId: 'test_ref_code' });
      mockDatabaseService.user.findFirst.mockResolvedValue({ userId: 0 });
      mockAuthService.hashPassword.mockResolvedValue('hashed_password');
      mockAuthService.generateToken.mockResolvedValue('test_token');

      const newUser = {
        userId: 1,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
      };
      mockDatabaseService.user.create.mockResolvedValue(newUser);

      const result = await service.emailRegister(mockEmailRegisterDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('注册成功');
      expect(result.data.userId).toBe(1);
      expect(mockAuthService.hashPassword).toHaveBeenCalledWith('password123');
      expect(mockAuthService.generateToken).toHaveBeenCalled();
    });
  });

  describe('emailLogin', () => {
    const mockEmailLoginDto: EmailLoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should throw error when email not found', async () => {
      mockDatabaseService.user.findUnique.mockResolvedValue(null);

      await expect(service.emailLogin(mockEmailLoginDto)).rejects.toThrow(
        new BadRequestException('邮箱不存在')
      );
    });

    it('should throw error when account is disabled', async () => {
      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        isEnable: false,
        isDeleted: false,
      };
      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.emailLogin(mockEmailLoginDto)).rejects.toThrow(
        new BadRequestException('账号已被禁用')
      );
    });

    it('should throw error when password is invalid', async () => {
      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        isEnable: true,
        isDeleted: false,
      };
      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);
      mockAuthService.validatePassword.mockResolvedValue(false);

      await expect(service.emailLogin(mockEmailLoginDto)).rejects.toThrow(
        new BadRequestException('密码错误')
      );
    });

    it('should login successfully', async () => {
      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'Test User',
        isEnable: true,
        isDeleted: false,
      };
      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);
      mockAuthService.validatePassword.mockResolvedValue(true);
      mockAuthService.generateToken.mockResolvedValue('test_token');

      const result = await service.emailLogin(mockEmailLoginDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('登录成功');
      expect(result.data.userId).toBe(1);
      expect(result.data.token).toBe('test_token');
    });
  });

  describe('login', () => {
    const mockLoginDto: LoginDto = {
      usernameOrEmail: 'test@example.com',
      password: 'password123',
    };

    it('should throw error when user not found', async () => {
      mockDatabaseService.user.findFirst.mockResolvedValue(null);

      await expect(service.login(mockLoginDto)).rejects.toThrow(
        new BadRequestException('用户不存在')
      );
    });

    it('should login with email successfully', async () => {
      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'Test User',
        isEnable: true,
        isDeleted: false,
      };
      mockDatabaseService.user.findFirst.mockResolvedValue(mockUser);
      mockAuthService.validatePassword.mockResolvedValue(true);
      mockAuthService.generateToken.mockResolvedValue('test_token');

      const result = await service.login(mockLoginDto);

      expect(result.success).toBe(true);
      expect(result.data.userId).toBe(1);
    });

    it('should login with username successfully', async () => {
      const mockLoginDtoWithUsername = {
        usernameOrEmail: 'testuser',
        password: 'password123',
      };
      const mockUser = {
        userId: 1,
        name: 'testuser',
        password: 'hashed_password',
        email: 'test@example.com',
        isEnable: true,
        isDeleted: false,
      };
      mockDatabaseService.user.findFirst.mockResolvedValue(mockUser);
      mockAuthService.validatePassword.mockResolvedValue(true);
      mockAuthService.generateToken.mockResolvedValue('test_token');

      const result = await service.login(mockLoginDtoWithUsername);

      expect(result.success).toBe(true);
      expect(result.data.userId).toBe(1);
    });
  });

  describe('getUserInfo', () => {
    it('should throw error when user not found', async () => {
      const userId = 1;
      mockDatabaseService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserInfo(userId)).rejects.toThrow(
        new NotFoundException('用户不存在')
      );
    });

    it('should return user info', async () => {
      const userId = 1;
      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        name: 'Test User',
        address: 'Test Address',
        createdAt: new Date(),
      };
      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserInfo(userId);

      expect(result).toEqual(mockUser);
      expect(mockDatabaseService.user.findUnique).toHaveBeenCalledWith({
        where: { userId },
        select: {
          userId: true,
          email: true,
          name: true,
          address: true,
          createdAt: true,
        },
      });
    });
  });

  describe('registerByEmail', () => {
    it('should throw error when email already registered', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const name = 'Test User';
      mockDatabaseService.user.findUnique.mockResolvedValue({ userId: 1, email });

      await expect(service.registerByEmail(email, password, name)).rejects.toThrow(
        new BadRequestException('该邮箱已被注册')
      );
    });

    it('should register user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const name = 'Test User';
      const referralCode = 'test_ref_code';

      mockDatabaseService.user.findUnique.mockResolvedValue(null);
      mockAuthService.hashPassword.mockResolvedValue('hashed_password');
      mockAuthService.generateToken.mockResolvedValue('test_token');

      const newUser = {
        userId: 1,
        email,
        name,
        createdAt: new Date(),
      };
      mockDatabaseService.user.create.mockResolvedValue(newUser);

      const result = await service.registerByEmail(email, password, name, referralCode);

      expect(result.success).toBe(true);
      expect(result.message).toBe('注册成功');
      expect(result.data.user.email).toBe(email);
      expect(result.data.token).toBe('test_token');
    });
  });

  describe('loginByEmail', () => {
    it('should throw error when user not found', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      mockDatabaseService.user.findUnique.mockResolvedValue(null);

      await expect(service.loginByEmail(email, password)).rejects.toThrow(
        new NotFoundException('用户不存在')
      );
    });

    it('should throw error when user has no password', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = { userId: 1, email, password: null };
      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.loginByEmail(email, password)).rejects.toThrow(
        new BadRequestException('该用户未设置密码，请使用微信登录')
      );
    });

    it('should throw error when password is invalid', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = { userId: 1, email, password: 'hashed_password' };
      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);
      mockAuthService.validatePassword.mockResolvedValue(false);

      await expect(service.loginByEmail(email, password)).rejects.toThrow(
        new UnauthorizedException('密码错误')
      );
    });

    it('should login successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const mockUser = {
        userId: 1,
        email,
        password: 'hashed_password',
        name: 'Test User',
        createdAt: new Date(),
      };
      mockDatabaseService.user.findUnique.mockResolvedValue(mockUser);
      mockAuthService.validatePassword.mockResolvedValue(true);
      mockAuthService.generateToken.mockResolvedValue('test_token');

      const result = await service.loginByEmail(email, password);

      expect(result.success).toBe(true);
      expect(result.message).toBe('登录成功');
      expect(result.data.user.email).toBe(email);
      expect(result.data.token).toBe('test_token');
    });
  });

  describe('loginByUsernameOrEmail', () => {
    it('should login with email', async () => {
      const usernameOrEmail = 'test@example.com';
      const password = 'password123';
      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'Test User',
        createdAt: new Date(),
      };
      mockDatabaseService.user.findFirst.mockResolvedValue(mockUser);
      mockAuthService.validatePassword.mockResolvedValue(true);
      mockAuthService.generateToken.mockResolvedValue('test_token');

      const result = await service.loginByUsernameOrEmail(usernameOrEmail, password);

      expect(result.userId).toBe(1);
      expect(result.email).toBe('test@example.com');
      expect(result.token).toBe('test_token');
    });

    it('should login with username', async () => {
      const usernameOrEmail = 'testuser';
      const password = 'password123';
      const mockUser = {
        userId: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        name: 'testuser',
        createdAt: new Date(),
      };
      mockDatabaseService.user.findFirst.mockResolvedValue(mockUser);
      mockAuthService.validatePassword.mockResolvedValue(true);
      mockAuthService.generateToken.mockResolvedValue('test_token');

      const result = await service.loginByUsernameOrEmail(usernameOrEmail, password);

      expect(result.userId).toBe(1);
      expect(result.name).toBe('testuser');
      expect(result.token).toBe('test_token');
    });
  });
});
