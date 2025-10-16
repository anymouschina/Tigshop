// @ts-nocheck
import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import {
  Injectable,
  UnauthorizedException,
  Inject,
  Logger,
} from "@nestjs/common";
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
      secretOrKey: "your-secret-key", // 与LoginModule保持一致
      passReqToCallback: true, // Pass request to validate method
    });

    this.logger.debug(
      `JWT Strategy initialized with secret: ${config.jwtSecret}`,
    );
  }

  /**
   * Validate the JWT payload and find the user
   *
   * @param req - Express request object
   * @param payload - JWT payload containing user info
   * @returns User object if valid, throws UnauthorizedException if invalid
   */
  async validate(req: Request, payload: JwtPayload) {
    this.logger.debug(
      `JWT validate called with payload: ${JSON.stringify(payload)}`,
    );

    // Log authorization header for debugging
    const authHeader = req.headers.authorization;
    this.logger.debug(
      `Authorization header: ${authHeader ? "Present" : "Missing"}`,
    );
    this.logger.debug(
      `JWT Secret configured: ${process.env.JWT_SECRET ? "Yes" : "No"}`,
    );

    // Handle multiple token formats
    let userId: number;
    if (payload.data && payload.data.appId) {
      // PHP-compatible format: payload.data.appId contains the user ID
      userId = payload.data.appId;
      this.logger.debug(`Using PHP-compatible token format, userId: ${userId}`);
    } else if (payload.userId) {
      // Alternative standard format: payload.userId contains the user ID
      userId = payload.userId;
      this.logger.debug(`Using alternative standard format, userId: ${userId}`);
    } else if (payload.sub) {
      // Standard JWT format: payload.sub contains the user ID
      userId = payload.sub;
      this.logger.debug(`Using standard JWT format, userId: ${userId}`);
    } else if (payload.user_id) {
      // Snake case format: payload.user_id contains the user ID
      userId = payload.user_id;
      this.logger.debug(`Using snake_case format, userId: ${userId}`);
    } else {
      this.logger.error(
        `Invalid token payload: cannot find user ID in payload: ${JSON.stringify(payload)}`,
      );
      throw new UnauthorizedException("Invalid token payload");
    }

    // Note: Token blacklist checking would need the actual token
    // Since we're using passport-jwt, the token is not directly available here
    // This could be implemented in a custom guard if needed

    // Find user
    const user = await this.databaseService.user.findUnique({
      where: { user_id: userId },
    });

    this.logger.debug(
      `Looking for user with user_id: ${userId}, found: ${!!user}`,
    );
    this.logger.debug(`Payload contents: ${JSON.stringify(payload)}`);

    if (!user) {
      this.logger.error(`User not found for user_id: ${userId}`);
      throw new UnauthorizedException("User not found");
    }

    // Strip sensitive information
    delete user.password;

    this.logger.debug(
      `User validation successful for user_id: ${user.user_id}, username: ${user.username}`,
    );

    // 为了兼容现有控制器大多使用 req.user.userId 的驼峰写法，同时保留原始 snake_case 字段，增加别名。
    // 注意：不要删除原字段，避免已经使用 req.user.user_id 的代码出问题。
    const unifiedUser: any = {
      ...user, // 保留数据库字段 (user_id, avatar, etc.)
      userId: user.user_id, // 驼峰别名
      mobileValidated: user.mobile_validated,
      emailValidated: user.email_validated,
      rankId: user.rank_id,
      referrerUserId: user.referrer_user_id,
      fromTag: user.from_tag,
      svipExpireTime: user.svip_expire_time,
      orderCount: user.order_count,
      orderAmount: user.order_amount,
      historyProductIds: user.history_product_ids,
      distributionRegisterTime: user.distribution_register_time,
      lastLogin: user.last_login,
      lastIp: user.last_ip,
    };

    // 方便调试一次性确认返回结构（只打印关键字段，避免日志过大）
    this.logger.debug(
      `Unified user object keys: ${Object.keys(unifiedUser).slice(0, 30).join(", ")}...`,
    );

    return unifiedUser;
  }
}
