import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '../../config/config.service';
import { DatabaseService } from '../../database/database.service';
import { JwtPayload } from '../auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<AppConfigService>;
  let databaseService: jest.Mocked<DatabaseService>;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  const mockConfigService = {
    jwtSecret: 'test_secret',
    jwtExpiration: '3600s',
  };

  const mockDatabaseService = {
    blacklistedToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: AppConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    configService = module.get(AppConfigService) as jest.Mocked<AppConfigService>;
    databaseService = module.get(DatabaseService) as jest.Mocked<DatabaseService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate JWT token with user ID and additional payload', async () => {
      const userId = 1;
      const additionalPayload: Partial<JwtPayload> = {
        name: 'Test User',
        email: 'test@example.com',
      };
      const expectedPayload: JwtPayload = {
        sub: userId,
        ...additionalPayload,
      };
      const expectedToken = 'generated_token';

      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = await service.generateToken(userId, additionalPayload);

      expect(result).toBe(expectedToken);
      expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload);
    });

    it('should generate JWT token with only user ID when no additional payload', async () => {
      const userId = 1;
      const expectedPayload: JwtPayload = { sub: userId };
      const expectedToken = 'generated_token';

      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = await service.generateToken(userId);

      expect(result).toBe(expectedToken);
      expect(mockJwtService.sign).toHaveBeenCalledWith(expectedPayload);
    });
  });

  describe('verifyToken', () => {
    const token = 'test_token';
    const validPayload: JwtPayload = {
      sub: 1,
      name: 'Test User',
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    it('should return null when token is blacklisted', async () => {
      mockDatabaseService.blacklistedToken.findUnique.mockResolvedValue({
        token,
        userId: 1,
        expiresAt: new Date(Date.now() + 3600000),
      });

      const result = await service.verifyToken(token);

      expect(result).toBeNull();
      expect(mockDatabaseService.blacklistedToken.findUnique).toHaveBeenCalledWith({ where: { token } });
      expect(mockJwtService.verify).not.toHaveBeenCalled();
    });

    it('should return null when token verification fails', async () => {
      mockDatabaseService.blacklistedToken.findUnique.mockResolvedValue(null);
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.verifyToken(token);

      expect(result).toBeNull();
      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
    });

    it('should return decoded payload when token is valid', async () => {
      mockDatabaseService.blacklistedToken.findUnique.mockResolvedValue(null);
      mockJwtService.verify.mockReturnValue(validPayload);

      const result = await service.verifyToken(token);

      expect(result).toEqual(validPayload);
      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
    });
  });

  describe('blacklistToken', () => {
    const token = 'test_token';
    const userId = 1;
    const decodedToken: JwtPayload = {
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    it('should return false when token cannot be decoded', async () => {
      mockJwtService.decode.mockReturnValue(null);

      const result = await service.blacklistToken(token, userId);

      expect(result).toBe(false);
      expect(mockJwtService.decode).toHaveBeenCalledWith(token);
      expect(mockDatabaseService.blacklistedToken.create).not.toHaveBeenCalled();
    });

    it('should return false when decoded token has no expiration', async () => {
      const incompleteToken = { sub: userId };
      mockJwtService.decode.mockReturnValue(incompleteToken);

      const result = await service.blacklistToken(token, userId);

      expect(result).toBe(false);
      expect(mockJwtService.decode).toHaveBeenCalledWith(token);
      expect(mockDatabaseService.blacklistedToken.create).not.toHaveBeenCalled();
    });

    it('should blacklist token successfully', async () => {
      mockJwtService.decode.mockReturnValue(decodedToken);
      const expectedExpiresAt = new Date(decodedToken.exp! * 1000);

      mockDatabaseService.blacklistedToken.create.mockResolvedValue({
        token,
        userId,
        expiresAt: expectedExpiresAt,
      });

      const result = await service.blacklistToken(token, userId);

      expect(result).toBe(true);
      expect(mockJwtService.decode).toHaveBeenCalledWith(token);
      expect(mockDatabaseService.blacklistedToken.create).toHaveBeenCalledWith({
        data: {
          token,
          userId,
          expiresAt: expectedExpiresAt,
        },
      });
    });

    it('should return false when database operation fails', async () => {
      mockJwtService.decode.mockReturnValue(decodedToken);
      mockDatabaseService.blacklistedToken.create.mockRejectedValue(new Error('Database error'));

      const result = await service.blacklistToken(token, userId);

      expect(result).toBe(false);
    });
  });

  describe('hashPassword', () => {
    const password = 'test_password';
    const hashedPassword = 'hashed_password';

    beforeEach(() => {
      // Mock bcrypt
      jest.doMock('bcrypt', () => ({
        hash: jest.fn().mockResolvedValue(hashedPassword),
        genSalt: jest.fn().mockResolvedValue(10),
      }));
    });

    it('should hash password with salt rounds', async () => {
      const bcrypt = require('bcrypt');
      const salt = await bcrypt.genSalt(10);
      const result = await bcrypt.hash(password, salt);

      expect(result).toBe(hashedPassword);
    });
  });

  describe('validatePassword', () => {
    const password = 'test_password';
    const hash = 'hashed_password';

    beforeEach(() => {
      // Mock bcrypt
      jest.doMock('bcrypt', () => ({
        compare: jest.fn(),
      }));
    });

    it('should return true when password matches hash', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const result = await bcrypt.compare(password, hash);

      expect(result).toBe(true);
    });

    it('should return false when password does not match hash', async () => {
      const bcrypt = require('bcrypt');
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      const result = await bcrypt.compare(password, hash);

      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should delete expired blacklisted tokens', async () => {
      const now = new Date();

      await service.cleanupExpiredTokens();

      expect(mockDatabaseService.blacklistedToken.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });
    });
  });

  describe('onModuleInit', () => {
    it('should call cleanupExpiredTokens on module initialization', async () => {
      const cleanupSpy = jest.spyOn(service, 'cleanupExpiredTokens');

      await service.onModuleInit();

      expect(cleanupSpy).toHaveBeenCalled();
    });
  });
});