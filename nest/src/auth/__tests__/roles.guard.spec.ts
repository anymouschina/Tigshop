// @ts-nocheck
import { Test, TestingModule } from "@nestjs/testing";
import { RolesGuard } from "../guards/roles.guard";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { ExecutionContext, HttpException, HttpStatus } from "@nestjs/common";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector) as jest.Mocked<Reflector>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("canActivate", () => {
    let mockContext: ExecutionContext;

    beforeEach(() => {
      mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn(),
      } as any;
    });

    it("should return true when no roles are required", () => {
      mockReflector.getAllAndOverride.mockReturnValue(null);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it("should return false when user is not present in request", () => {
      const requiredRoles = ["admin"];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);

      const mockRequest = {};
      const mockSwitchToHttp = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
      };

      (mockContext.switchToHttp as jest.Mock).mockReturnValue(mockSwitchToHttp);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it("should return false when user has no roles", () => {
      const requiredRoles = ["admin"];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);

      const mockRequest = { user: {} };
      const mockSwitchToHttp = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
      };

      (mockContext.switchToHttp as jest.Mock).mockReturnValue(mockSwitchToHttp);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it("should return false when user roles do not include required role", () => {
      const requiredRoles = ["admin"];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);

      const mockRequest = { user: { roles: ["user"] } };
      const mockSwitchToHttp = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
      };

      (mockContext.switchToHttp as jest.Mock).mockReturnValue(mockSwitchToHttp);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it("should return true when user has one of the required roles", () => {
      const requiredRoles = ["admin", "editor"];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);

      const mockRequest = { user: { roles: ["user", "editor"] } };
      const mockSwitchToHttp = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
      };

      (mockContext.switchToHttp as jest.Mock).mockReturnValue(mockSwitchToHttp);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it("should return true when user has all required roles", () => {
      const requiredRoles = ["admin", "editor"];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);

      const mockRequest = { user: { roles: ["admin", "editor", "user"] } };
      const mockSwitchToHttp = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
      };

      (mockContext.switchToHttp as jest.Mock).mockReturnValue(mockSwitchToHttp);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it("should return true when user has the single required role", () => {
      const requiredRoles = ["admin"];
      mockReflector.getAllAndOverride.mockReturnValue(requiredRoles);

      const mockRequest = { user: { roles: ["admin"] } };
      const mockSwitchToHttp = {
        getRequest: jest.fn().mockReturnValue(mockRequest),
      };

      (mockContext.switchToHttp as jest.Mock).mockReturnValue(mockSwitchToHttp);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });
});
