// @ts-nocheck
import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException, Inject, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { Request } from "express";

interface AdminJwtPayload {
  userId: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  private readonly logger = new Logger(AdminJwtStrategy.name);

  constructor(
    private readonly databaseService: PrismaService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return null;
        }

        if (authHeader.startsWith("Bearer ")) {
          // Format: "Bearer <token>"
          return authHeader.substring(7);
        } else {
          // Format: direct token
          return authHeader;
        }
      },
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || "your-secret-key",
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: AdminJwtPayload) {
    this.logger.debug(`Admin JWT validate called with payload: ${JSON.stringify(payload)}`);

    // Log authorization header for debugging
    const authHeader = req.headers.authorization;
    this.logger.debug(`Authorization header: ${authHeader ? 'Present' : 'Missing'}`);
    this.logger.debug(`Auth header value: ${authHeader}`);

    // Check if this is an admin token
    if (!payload.role || payload.role !== 'admin') {
      this.logger.error(`Invalid admin token: role is missing or not admin. Role: ${payload.role}`);
      throw new UnauthorizedException("Invalid admin token");
    }

    // Find admin user
    const adminUser = await this.databaseService.admin_user.findUnique({
      where: { admin_id: payload.userId },
    });

    this.logger.debug(`Looking for admin user with admin_id: ${payload.userId}, found: ${!!adminUser}`);

    if (!adminUser) {
      this.logger.error(`Admin user not found for admin_id: ${payload.userId}`);
      throw new UnauthorizedException("Admin user not found");
    }

    this.logger.debug(`Admin user found: ${JSON.stringify({
      admin_id: adminUser.admin_id,
      username: adminUser.username,
      email: adminUser.email
    })}`);

    // Return admin user info with consistent field names
    const result = {
      userId: adminUser.admin_id,
      username: adminUser.username,
      email: adminUser.email,
      role: 'admin',
      adminId: adminUser.admin_id, // For backward compatibility
    };

    this.logger.debug(`Returning user object: ${JSON.stringify(result)}`);
    return result;
  }
}