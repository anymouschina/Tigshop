// @ts-nocheck
import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException, Inject, Logger } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { JwtPayload } from "../auth.service";
import { Request } from "express";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    @Inject("CONFIG") private readonly config: any,
    private readonly databaseService: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.jwtSecret || "fallback-secret-key",
      passReqToCallback: true, // Pass request to validate method
    });

    this.logger.debug(`JWT Strategy initialized with secret: ${config.jwtSecret}`);
  }

  /**
   * Validate the JWT payload and find the user
   *
   * @param req - Express request object
   * @param payload - JWT payload containing user info
   * @returns User object if valid, throws UnauthorizedException if invalid
   */
  async validate(req: Request, payload: JwtPayload) {
    this.logger.debug(`JWT validate called with payload: ${JSON.stringify(payload)}`);

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Invalid token format");
    }

    const token = authHeader.split(" ")[1];
    this.logger.debug(`Token extracted: ${token.substring(0, 20)}...`);

    // Check if token is blacklisted
    const blacklistedToken =
      await this.databaseService.blacklistedToken.findUnique({
        where: { token },
      });

    if (blacklistedToken) {
      throw new UnauthorizedException("Token has been revoked");
    }

    // Find user
    const user = await this.databaseService.user.findUnique({
      where: { user_id: payload.sub },
    });

    this.logger.debug(`Looking for user with user_id: ${payload.sub}, found: ${!!user}`);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Strip sensitive information
    delete user.password;

    this.logger.debug(`User validation successful for user_id: ${user.user_id}`);
    return user;
  }
}
