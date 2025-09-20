// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { UserController, WxUserController, AdminReferralController, EmailAuthController } from '../user.controller';
import { UserService } from '../user.service';
import { AuthService } from '../../auth/auth.service';
import { MailService } from '../../mail/mail.service';
import { EmailVerificationService } from '../services/email-verification.service';
import { WxLoginDto } from '../dto/wx-login.dto';
import { ReferralDto } from '../dto/referral.dto';
import { CreateReferralCodeDto } from '../dto/create-referral-code.dto';
import { SendEmailCodeDto, EmailRegisterDto, EmailLoginDto } from '../dto/email-register.dto';
import { LoginDto } from '../dto/login.dto';
import { BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';

describe('UserController', () => {
  let userController: UserController;
  let wxUserController: WxUserController;
  let adminReferralController: AdminReferralController;
  let emailAuthController: EmailAuthController;
  let userService: jest.Mocked<UserService>;
  let authService: jest.Mocked<AuthService>;
  let mailService: jest.Mocked<MailService>;
  let emailVerificationService: jest.Mocked<EmailVerificationService>;

  const mockUserService = {
    getOrders: jest.fn(),
    wxLogin: jest.fn(),
    getUserInfo: jest.fn(),
    referralUser: jest.fn(),
    getReferralStats: jest.fn(),
    createReferralCode: jest.fn(),
    getAllReferralCodes: jest.fn(),
    updateReferralCodeStatus: jest.fn(),
    registerByEmail: jest.fn(),
    loginByEmail: jest.fn(),
    loginByUsernameOrEmail: jest.fn(),
  };

  const mockAuthService = {
    blacklistToken: jest.fn(),
  };

  const mockMailService = {
    sendVerificationCode: jest.fn(),
  };

  const mockEmailVerificationService = {
    isCodeSentRecently: jest.fn(),
    getRemainingTime: jest.fn(),
    sendVerificationCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        UserController,
        WxUserController,
        AdminReferralController,
        EmailAuthController,
      ],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: EmailVerificationService,
          useValue: mockEmailVerificationService,
        },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
    wxUserController = module.get<WxUserController>(WxUserController);
    adminReferralController = module.get<AdminReferralController>(AdminReferralController);
    emailAuthController = module.get<EmailAuthController>(EmailAuthController);
    userService = module.get(UserService) as jest.Mocked<UserService>;
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
    mailService = module.get(MailService) as jest.Mocked<MailService>;
    emailVerificationService = module.get(EmailVerificationService) as jest.Mocked<EmailVerificationService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('UserController', () => {
    describe('getOrders', () => {
      it('should throw BadRequestException when service returns error', async () => {
        const userId = 1;
        mockUserService.getOrders.mockResolvedValue({ error: { message: 'User not found' } });

        await expect(userController.getOrders(userId)).rejects.toThrow(BadRequestException);
      });

      it('should return orders when service returns valid data', async () => {
        const userId = 1;
        const mockOrders = [
          { orderId: 1, totalAmount: 100, products: [] },
          { orderId: 2, totalAmount: 200, products: [] },
        ];
        mockUserService.getOrders.mockResolvedValue(mockOrders);

        const result = await userController.getOrders(userId);

        expect(result).toEqual(mockOrders);
        expect(mockUserService.getOrders).toHaveBeenCalledWith(userId);
      });
    });

    describe('wxLogin', () => {
      it('should call userService.wxLogin with provided data', async () => {
        const wxLoginDto: WxLoginDto = {
          code: 'test_code',
          userInfo: { nickName: 'Test User' },
          errMsg: 'success',
        };
        const mockResult = { user: { userId: 1 }, token: 'test_token' };
        mockUserService.wxLogin.mockResolvedValue(mockResult);

        const result = await userController.wxLogin(wxLoginDto);

        expect(result).toEqual(mockResult);
        expect(mockUserService.wxLogin).toHaveBeenCalledWith(wxLoginDto);
      });
    });

    describe('logout', () => {
      const mockUser = { userId: 1, email: 'test@example.com' };

      it('should throw UnauthorizedException when authorization header is missing', async () => {
        await expect(userController.logout(mockUser, '')).rejects.toThrow(UnauthorizedException);
      });

      it('should throw UnauthorizedException when authorization header format is invalid', async () => {
        await expect(userController.logout(mockUser, 'InvalidToken')).rejects.toThrow(UnauthorizedException);
      });

      it('should throw BadRequestException when token blacklisting fails', async () => {
        const authorization = 'Bearer test_token';
        mockAuthService.blacklistToken.mockResolvedValue(false);

        await expect(userController.logout(mockUser, authorization)).rejects.toThrow(BadRequestException);
      });

      it('should return success message when logout is successful', async () => {
        const authorization = 'Bearer test_token';
        mockAuthService.blacklistToken.mockResolvedValue(true);

        const result = await userController.logout(mockUser, authorization);

        expect(result).toEqual({ message: 'Successfully logged out' });
        expect(mockAuthService.blacklistToken).toHaveBeenCalledWith('test_token', mockUser.userId);
      });
    });
  });

  describe('WxUserController', () => {
    describe('wxLogin', () => {
      it('should call userService.wxLogin with provided data', async () => {
        const wxLoginDto: WxLoginDto = {
          code: 'test_code',
          userInfo: { nickName: 'Test User' },
          errMsg: 'success',
        };
        const mockResult = { user: { userId: 1 }, token: 'test_token' };
        mockUserService.wxLogin.mockResolvedValue(mockResult);

        const result = await wxUserController.wxLogin(wxLoginDto);

        expect(result).toEqual(mockResult);
        expect(mockUserService.wxLogin).toHaveBeenCalledWith(wxLoginDto);
      });
    });

    describe('getUserInfo', () => {
      const mockUser = { userId: 1, email: 'test@example.com' };

      it('should return user info', async () => {
        const mockUserInfo = { userId: 1, email: 'test@example.com', name: 'Test User' };
        mockUserService.getUserInfo.mockResolvedValue(mockUserInfo);

        const result = await wxUserController.getUserInfo(mockUser);

        expect(result).toEqual(mockUserInfo);
        expect(mockUserService.getUserInfo).toHaveBeenCalledWith(mockUser.userId);
      });
    });

    describe('logout', () => {
      const mockUser = { userId: 1, email: 'test@example.com' };

      it('should return success message when logout is successful', async () => {
        const authorization = 'Bearer test_token';
        mockAuthService.blacklistToken.mockResolvedValue(true);

        const result = await wxUserController.logout(mockUser, authorization);

        expect(result).toEqual({ message: 'Successfully logged out' });
        expect(mockAuthService.blacklistToken).toHaveBeenCalledWith('test_token', mockUser.userId);
      });
    });

    describe('referralUser', () => {
      const mockUser = { userId: 1, email: 'test@example.com' };
      const referralDto: ReferralDto = {
        refCode: 'test_ref_code',
        source: 'test_source',
      };

      it('should call userService.referralUser with user ID and referral data', async () => {
        const mockResult = { success: true, message: '引荐人关联成功' };
        mockUserService.referralUser.mockResolvedValue(mockResult);

        const result = await wxUserController.referralUser(mockUser, referralDto);

        expect(result).toEqual(mockResult);
        expect(mockUserService.referralUser).toHaveBeenCalledWith(mockUser.userId, referralDto);
      });
    });

    describe('getReferralStats', () => {
      const mockUser = { userId: 1, email: 'test@example.com' };

      it('should get referral stats for current user when onlySelf is true', async () => {
        const mockResult = { success: true, data: { stats: [] } };
        mockUserService.getReferralStats.mockResolvedValue(mockResult);

        const result = await wxUserController.getReferralStats(mockUser, 'true');

        expect(result).toEqual(mockResult);
        expect(mockUserService.getReferralStats).toHaveBeenCalledWith(mockUser.userId);
      });

      it('should get all referral stats when onlySelf is false', async () => {
        const mockResult = { success: true, data: { stats: [] } };
        mockUserService.getReferralStats.mockResolvedValue(mockResult);

        const result = await wxUserController.getReferralStats(mockUser, 'false');

        expect(result).toEqual(mockResult);
        expect(mockUserService.getReferralStats).toHaveBeenCalledWith(undefined);
      });

      it('should get all referral stats when onlySelf is not provided', async () => {
        const mockResult = { success: true, data: { stats: [] } };
        mockUserService.getReferralStats.mockResolvedValue(mockResult);

        const result = await wxUserController.getReferralStats(mockUser);

        expect(result).toEqual(mockResult);
        expect(mockUserService.getReferralStats).toHaveBeenCalledWith(undefined);
      });
    });
  });

  describe('AdminReferralController', () => {
    describe('createReferralCode', () => {
      it('should call userService.createReferralCode with provided data', async () => {
        const createReferralCodeDto: CreateReferralCodeDto = {
          refCode: 'TEST_CODE',
          description: 'Test referral code',
        };
        const mockResult = { success: true, message: '引荐码创建成功' };
        mockUserService.createReferralCode.mockResolvedValue(mockResult);

        const result = await adminReferralController.createReferralCode(createReferralCodeDto);

        expect(result).toEqual(mockResult);
        expect(mockUserService.createReferralCode).toHaveBeenCalledWith(createReferralCodeDto);
      });
    });

    describe('getAllReferralCodes', () => {
      it('should get active referral codes when activeOnly is true', async () => {
        const mockResult = { success: true, data: [] };
        mockUserService.getAllReferralCodes.mockResolvedValue(mockResult);

        const result = await adminReferralController.getAllReferralCodes('true');

        expect(result).toEqual(mockResult);
        expect(mockUserService.getAllReferralCodes).toHaveBeenCalledWith(true);
      });

      it('should get all referral codes when activeOnly is false', async () => {
        const mockResult = { success: true, data: [] };
        mockUserService.getAllReferralCodes.mockResolvedValue(mockResult);

        const result = await adminReferralController.getAllReferralCodes('false');

        expect(result).toEqual(mockResult);
        expect(mockUserService.getAllReferralCodes).toHaveBeenCalledWith(false);
      });

      it('should get all referral codes when activeOnly is not provided', async () => {
        const mockResult = { success: true, data: [] };
        mockUserService.getAllReferralCodes.mockResolvedValue(mockResult);

        const result = await adminReferralController.getAllReferralCodes();

        expect(result).toEqual(mockResult);
        expect(mockUserService.getAllReferralCodes).toHaveBeenCalledWith(false);
      });
    });

    describe('updateReferralCodeStatus', () => {
      it('should call userService.updateReferralCodeStatus with id and isActive', async () => {
        const id = 1;
        const isActive = true;
        const mockResult = { success: true, message: '引荐码已激活' };
        mockUserService.updateReferralCodeStatus.mockResolvedValue(mockResult);

        const result = await adminReferralController.updateReferralCodeStatus(id, isActive);

        expect(result).toEqual(mockResult);
        expect(mockUserService.updateReferralCodeStatus).toHaveBeenCalledWith(id, isActive);
      });
    });
  });

  describe('EmailAuthController', () => {
    describe('sendVerificationCode', () => {
      it('should throw BadRequestException when code was sent recently', async () => {
        const sendEmailCodeDto: SendEmailCodeDto = { email: 'test@example.com' };
        emailVerificationService.isCodeSentRecently.mockResolvedValue(true);
        emailVerificationService.getRemainingTime.mockResolvedValue(60);

        await expect(emailAuthController.sendVerificationCode(sendEmailCodeDto)).rejects.toThrow(
          new BadRequestException('请60秒后再试')
        );
      });

      it('should throw BadRequestException when email is already registered', async () => {
        const sendEmailCodeDto: SendEmailCodeDto = { email: 'test@example.com' };
        emailVerificationService.isCodeSentRecently.mockResolvedValue(false);
        (mockUserService as any).databaseService = {
          user: {
            findUnique: jest.fn().mockResolvedValue({ userId: 1, email: 'test@example.com' }),
          },
        };

        await expect(emailAuthController.sendVerificationCode(sendEmailCodeDto)).rejects.toThrow(
          new BadRequestException('该邮箱已被注册')
        );
      });

      it('should send verification code successfully', async () => {
        const sendEmailCodeDto: SendEmailCodeDto = { email: 'test@example.com' };
        emailVerificationService.isCodeSentRecently.mockResolvedValue(false);
        (mockUserService as any).databaseService = {
          user: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
        };
        emailVerificationService.sendVerificationCode.mockResolvedValue(undefined);

        const result = await emailAuthController.sendVerificationCode(sendEmailCodeDto);

        expect(result).toEqual({
          success: true,
          message: '验证码已发送到您的邮箱',
        });
        expect(emailVerificationService.sendVerificationCode).toHaveBeenCalledWith('test@example.com');
      });
    });

    describe('registerByEmail', () => {
      it('should throw BadRequestException when verification code is invalid', async () => {
        const emailRegisterDto: EmailRegisterDto = {
          email: 'test@example.com',
          code: '123456',
          password: 'password123',
          name: 'Test User',
        };
        emailVerificationService.verifyCode.mockResolvedValue({
          success: false,
          message: '验证码无效',
        });

        await expect(emailAuthController.registerByEmail(emailRegisterDto)).rejects.toThrow(
          new BadRequestException('验证码无效')
        );
      });

      it('should register user successfully', async () => {
        const emailRegisterDto: EmailRegisterDto = {
          email: 'test@example.com',
          code: '123456',
          password: 'password123',
          name: 'Test User',
          referralCode: 'test_ref_code',
        };
        emailVerificationService.verifyCode.mockResolvedValue({
          success: true,
          message: '验证码有效',
        });
        const mockResult = { success: true, message: '注册成功', data: { userId: 1 } };
        mockUserService.registerByEmail.mockResolvedValue(mockResult);

        const result = await emailAuthController.registerByEmail(emailRegisterDto);

        expect(result).toEqual(mockResult);
        expect(mockUserService.registerByEmail).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
          'Test User',
          'test_ref_code'
        );
      });

      it('should use email as name when name is not provided', async () => {
        const emailRegisterDto: EmailRegisterDto = {
          email: 'test@example.com',
          code: '123456',
          password: 'password123',
        };
        emailVerificationService.verifyCode.mockResolvedValue({
          success: true,
          message: '验证码有效',
        });
        const mockResult = { success: true, message: '注册成功', data: { userId: 1 } };
        mockUserService.registerByEmail.mockResolvedValue(mockResult);

        const result = await emailAuthController.registerByEmail(emailRegisterDto);

        expect(result).toEqual(mockResult);
        expect(mockUserService.registerByEmail).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
          'test',
          undefined
        );
      });
    });

    describe('login', () => {
      it('should call userService.loginByUsernameOrEmail with provided credentials', async () => {
        const loginDto: LoginDto = {
          usernameOrEmail: 'test@example.com',
          password: 'password123',
        };
        const mockResult = { success: true, data: { userId: 1, token: 'test_token' } };
        mockUserService.loginByUsernameOrEmail.mockResolvedValue(mockResult);

        const result = await emailAuthController.login(loginDto);

        expect(result).toEqual(mockResult);
        expect(mockUserService.loginByUsernameOrEmail).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });
    });

    describe('loginByEmail', () => {
      it('should call userService.loginByEmail with provided credentials', async () => {
        const emailLoginDto: EmailLoginDto = {
          email: 'test@example.com',
          password: 'password123',
        };
        const mockResult = { success: true, data: { userId: 1, token: 'test_token' } };
        mockUserService.loginByEmail.mockResolvedValue(mockResult);

        const result = await emailAuthController.loginByEmail(emailLoginDto);

        expect(result).toEqual(mockResult);
        expect(mockUserService.loginByEmail).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });
    });
  });
});
