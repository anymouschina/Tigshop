// @ts-nocheck
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { AuthService } from "../auth/auth.service";
import { VerificationCodeService } from "../auth/services/verification-code.service";
import { UploadService } from "../upload/upload.service";
import { UploadType } from "../upload/dto/upload.dto";

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly databaseService: PrismaService,
    private readonly authService: AuthService,
    private readonly verificationCodeService: VerificationCodeService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * 根据ID查找用户
   */
  async findById(id: number) {
    const user = await this.databaseService.user.findUnique({
      where: { user_id: id },
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    return user;
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string) {
    return this.databaseService.user.findFirst({
      where: { email },
    });
  }

  /**
   * 根据手机号查找用户
   */
  async findByMobile(mobile: string) {
    return this.databaseService.user.findFirst({
      where: { mobile },
    });
  }

  /**
   * 创建用户
   */
  async create(userData: {
    email?: string;
    mobile?: string;
    password?: string;
    name?: string;
    openId?: string;
  }) {
    // 检查邮箱是否已存在
    if (userData.email) {
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new BadRequestException("邮箱已被注册");
      }
    }

    // 检查手机号是否已存在
    if (userData.mobile) {
      const existingUser = await this.findByMobile(userData.mobile);
      if (existingUser) {
        throw new BadRequestException("手机号已被注册");
      }
    }

    return this.databaseService.user.create({
      data: userData,
    });
  }

  /**
   * 更新用户信息
   */
  async update(
    id: number,
    updateData: {
      name?: string;
      email?: string;
      mobile?: string;
      avatarUrl?: string;
      nickname?: string;
    },
  ) {
    await this.findById(id);

    return this.databaseService.user.update({
      where: { user_id: id },
      data: updateData,
    });
  }

  /**
   * 更新用户密码
   */
  async updatePassword(id: number, oldPassword: string, newPassword: string) {
    const user = await this.findById(id);

    // 这里应该添加密码验证逻辑
    // if (!await bcrypt.compare(oldPassword, user.password)) {
    //   throw new BadRequestException('原密码错误');
    // }

    return this.databaseService.user.update({
      where: { user_id: id },
      data: { password: newPassword }, // 实际应该加密
    });
  }

  /**
   * 更新最后登录信息
   */
  async updateLoginInfo(id: number, ip: string) {
    return this.databaseService.user.update({
      where: { user_id: id },
      data: {
        last_login: Math.floor(Date.now() / 1000),
        // lastLoginIp field doesn't exist in the User model
      },
    });
  }

  /**
   * 用户注册 - 对齐PHP版本
   */
  async register(registerData: any) {
    // 调用AuthService的注册方法
    return this.authService.register(registerData);
  }

  /**
   * 发送注册邮件验证码
   */
  async sendRegisterEmailCode(email: string) {
    // 检查邮箱是否已注册
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException("邮箱已被注册");
    }

    // 生成验证码
    const code = await this.verificationCodeService.generateEmailCode(email);

    return {
      status: "success",
      message: "验证码已发送",
      data: { code }, // 生产环境不返回验证码
    };
  }

  /**
   * 获取用户详情
   */
  async getUserDetail(user_id: number) {
    // 基础用户
    const user = await this.databaseService.user.findUnique({
      where: { user_id },
    });
    if (!user) throw new NotFoundException("用户不存在");

    // 会员等级
    const rank = user.rank_id
      ? await this.databaseService.user_rank.findUnique({
          where: { rank_id: Number(user.rank_id) },
        })
      : null;

    // 会员等级配置（按 code=rank_config 取最新一条）
    const rankConfig = await this.databaseService.user_rank_config.findFirst({
      where: { code: "rank_config" },
      orderBy: { id: "desc" },
    });
    const rankConfigParsed = rankConfig?.data
      ? { id: rankConfig.id, code: rankConfig.code, rankType: rankConfig.rank_type, data: safeJson(rankConfig.data) }
      : rankConfig
        ? { id: rankConfig.id, code: rankConfig.code, rankType: rankConfig.rank_type, data: null }
        : null;

    // 销售员（如果有）
    const salesman = await this.databaseService.salesman.findFirst({
      where: { user_id },
      orderBy: { salesman_id: "desc" },
    });

    // 优惠券数量
    const coupon = await this.databaseService.user_coupon.count({
      where: { user_id, used_time: 0 },
    });

    // 汇总余额
    const totalBalance = (Number(user.balance) + Number(user.frozen_balance)).toFixed(2);

    // 掩码用户名 dimUsername
    const dimUsername = maskUsername(user.username || user.mobile || "");

    // 是否绑定微信 isBindWechat（是否存在 authorize_type=2 或 open_id 非空）
    const isBindWechat =
      (await this.databaseService.user_authorize.count({
        where: { user_id, OR: [{ authorize_type: 2 }, { open_id: { not: "" } }] },
      })) > 0;

    // 生日格式化
    const birthdayStr = user.birthday ? formatDate(user.birthday) : "";

    // 折扣字符串
    const discountStr = rank ? String(rank.discount) : "0.0";

    // 构造返回（对齐示例字段名）
    return {
      dimUsername,
      userId: user.user_id,
      username: user.username,
      nickname: user.nickname ?? "",
      avatar: user.avatar,
      points: user.points,
      balance: Number(user.balance).toFixed(2),
      frozenBalance: Number(user.frozen_balance).toFixed(2),
      birthday: birthdayStr,
      mobile: user.mobile,
      email: user.email,
      rankId: user.rank_id,
      wechatImg: user.wechat_img,
      isCompanyAuth: user.is_company_auth,
      rankName: rank?.rank_name ?? "",
      minGrowthPoints: rank ? Number(rank.min_growth_points).toFixed(2) : "0.00",
      rankIco: rank?.rank_ico ?? "",
      discount: discountStr,
      rankType: rank?.rank_type ?? 0,
      rankBg: rank?.rank_bg ?? "",
      rankPoint: rank?.rank_point ?? "0",
      freeShipping: rank?.free_shipping ?? 0,
      rights: rank?.rights ? safeJson(rank.rights) ?? [] : [],
      rankLevel: rank?.rank_level ?? "",
      rankCardType: rank?.rank_card_type ?? 1,
      rankLogo: rank?.rank_logo ?? "",
      totalBalance,
      coupon,
      rankExpireTime: user.svip_expire_time ? formatUnixTs(user.svip_expire_time) : "",
      growth: 0,
      growthPoints: user.growth_points,
      rankConfig: rankConfigParsed,
      isBindWechat,
      salesman: salesman
        ? {
            salesmanId: salesman.salesman_id,
            userId: salesman.user_id ?? 0,
            level: salesman.level ?? 1,
            groupId: salesman.group_id ?? 0,
            pid: salesman.pid ?? 0,
            addTime: salesman.add_time ? formatUnixTs(Number(salesman.add_time)) : "",
            shopId: salesman.shop_id ?? 0,
            saleAmount: salesman.sale_amount ? String(salesman.sale_amount) : "0.00",
          }
        : null,
      showSign: "",
      hasShop: false,
    };
  }

  /**
   * 更新用户信息
   */
  async updateInformation(user_id: number, updateData: any) {
    await this.findById(user_id);

    // 如果更新邮箱，需要验证
    if (updateData.email) {
      const existingUser = await this.findByEmail(updateData.email);
      if (existingUser && existingUser.user_id !== user_id) {
        throw new ConflictException("邮箱已被使用");
      }
    }

    // 如果更新手机号，需要验证
    if (updateData.mobile) {
      const existingUser = await this.findByMobile(updateData.mobile);
      if (existingUser && existingUser.user_id !== user_id) {
        throw new ConflictException("手机号已被使用");
      }
    }

    // 允许更新的字段白名单（根据实际业务逐步扩展）
    const ALLOWED_FIELDS: Record<string, string> = {
      nickname: "nickname",
      mobile: "mobile",
      email: "email",
      avatar: "avatar",
      avatarUrl: "avatar", // 兼容前端可能的字段
      birthday: "birthday",
    };

    const data: any = {};
    for (const key of Object.keys(updateData || {})) {
      const mapped = ALLOWED_FIELDS[key];
      if (!mapped) continue; // 跳过不允许的字段（如 points / balance / rights 等只读字段）
      if (mapped === "birthday") {
        const raw = updateData[key];
        if (raw === null || raw === undefined || raw === "") {
          data.birthday = null; // 允许清空生日
        } else if (raw instanceof Date) {
          data.birthday = raw;
        } else if (typeof raw === "string") {
          // 仅支持 YYYY-MM-DD / YYYY/MM/DD 简单格式
            const norm = raw.replace(/\//g, "-");
            if (/^\d{4}-\d{2}-\d{2}$/.test(norm)) {
              const d = new Date(norm + "T00:00:00");
              if (!isNaN(d.getTime())) {
                data.birthday = d;
              }
            }
        }
        continue;
      }
      if (mapped === "avatar") {
        data.avatar = updateData[key] || "";
        continue;
      }
      data[mapped] = updateData[key];
    }

    // 如果没有任何可更新字段，直接返回当前详情
    if (Object.keys(data).length === 0) {
      const current = await this.findById(user_id);
      const { password: _pw, ...rest } = current as any;
      return { status: "success", message: "无可更新字段", data: rest };
    }

    const updatedUser = await this.databaseService.user.update({
      where: { user_id },
      data,
    });

    const { password, ...userDetails } = updatedUser;

    return {
      status: "success",
      message: "信息更新成功",
      data: userDetails,
    };
  }

  /**
   * 修改密码
   */
  async modifyPassword(
    user_id: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.findById(user_id);

    // 验证旧密码
    const isValidPassword = await this.authService.validatePassword(
      oldPassword,
      user.password,
    );
    if (!isValidPassword) {
      throw new UnauthorizedException("原密码错误");
    }

    // 加密新密码
    const hashedPassword = await this.authService.hashPassword(newPassword);

    await this.databaseService.user.update({
      where: { user_id },
      data: { password: hashedPassword },
    });

    return {
      status: "success",
      message: "密码修改成功",
    };
  }

  /**
   * 修改手机号
   */
  async modifyMobile(user_id: number, mobile: string, code: string) {
    // 验证短信验证码
    const isValidCode = await this.verificationCodeService.validateMobileCode(
      mobile,
      code,
    );
    if (!isValidCode) {
      throw new BadRequestException("验证码错误或已过期");
    }

    // 检查手机号是否已被使用
    const existingUser = await this.findByMobile(mobile);
    if (existingUser && existingUser.user_id !== user_id) {
      throw new ConflictException("手机号已被使用");
    }

    await this.databaseService.user.update({
      where: { user_id },
      data: {
        mobile,
        mobile_validated: 1,
      },
    });

    return {
      status: "success",
      message: "手机号修改成功",
    };
  }

  /**
   * 修改邮箱
   */
  async modifyEmail(user_id: number, email: string, code: string) {
    // 验证邮箱验证码
    const isValidCode = await this.verificationCodeService.validateEmailCode(
      email,
      code,
    );
    if (!isValidCode) {
      throw new BadRequestException("验证码错误或已过期");
    }

    // 检查邮箱是否已被使用
    const existingUser = await this.findByEmail(email);
    if (existingUser && existingUser.user_id !== user_id) {
      throw new ConflictException("邮箱已被使用");
    }

    await this.databaseService.user.update({
      where: { user_id },
      data: {
        email,
        email_validated: 1,
      },
    });

    return {
      status: "success",
      message: "邮箱修改成功",
    };
  }

  /**
   * 获取用户中心数据
   */
  async getMemberCenter(user_id: number) {
    const user = await this.findById(user_id);

    // 获取用户统计数据
    const orderCount = await this.databaseService.order.count({
      where: { user_id },
    });

    const favoriteCount = await this.databaseService.collect_product.count({
      where: { user_id },
    });

    const couponCount = await this.databaseService.user_coupon.count({
      where: { user_id },
    });

    return {
      status: "success",
      data: {
        userInfo: {
          user_id: user.user_id,
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar,
          email: user.email,
          mobile: user.mobile,
          emailValidated: user.email_validated,
          mobileValidated: user.mobile_validated,
          balance: user.balance,
          points: user.points,
          growthPoints: user.growth_points,
        },
        statistics: {
          orderCount,
          favoriteCount,
          couponCount,
        },
      },
    };
  }

  /**
   * 获取用户浏览历史
   */
  async getHistoryProduct(
    user_id: number,
    page: number = 1,
    limit: number = 10,
  ) {
    // 忽略 page / limit（保留参数签名以兼容调用），按 PHP 实现只返回最近最多 20 条。
    // 重构：抽离解析 / 查询 / 映射，便于后续扩展（例如需要补 viewTime、占位商品等）。

    const raw = await this.databaseService.user.findFirst({
      where: { user_id },
      select: { history_product_ids: true },
    });
    const historyIds = this.parseHistoryIds(raw?.history_product_ids).slice(0, 20);
    if (historyIds.length === 0) return [];

    const products = await this.fetchHistoryProducts(historyIds);
    const map = new Map(products.map((p: any) => [p.product_id, p]));

    return historyIds
      .map((id) => map.get(id))
      .filter(Boolean)
      .map((p) => this.mapHistoryProduct(p as any));
  }

  /** 解析用户 history_product_ids JSON 字符串为数字数组 */
  private parseHistoryIds(raw: any): number[] {
    if (!raw) return [];
    try {
      const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!Array.isArray(arr)) return [];
      return arr
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n) && n > 0);
    } catch {
      return [];
    }
  }

  /** 批量查询足迹商品（只取必要字段） */
  private async fetchHistoryProducts(ids: number[]) {
    if (ids.length === 0) return [];
    return this.databaseService.product.findMany({
      where: { product_id: { in: ids as any } },
      select: {
        product_id: true,
        category_id: true,
        brand_id: true,
        product_tsn: true,
        market_price: true,
        virtual_sales: true,
        shipping_tpl_id: true,
        free_shipping: true,
        pic_url: true,
        pic_thumb: true,
        product_name: true,
        check_status: true,
        check_reason: true,
        shop_id: true,
        suppliers_id: true,
        product_type: true,
        product_sn: true,
        product_price: true,
        product_status: true,
        is_best: true,
        is_new: true,
        is_hot: true,
        product_stock: true,
        sort_order: true,
      },
    });
  }

  /** 将商品行映射为足迹返回结构 */
  private mapHistoryProduct(p: any) {
    const money = (v: any) => (Number(v || 0)).toFixed(2);
    return {
      categoryId: p.category_id || 0,
      brandId: p.brand_id || 0,
      productTsn: p.product_tsn || "0",
      marketPrice: money(p.market_price),
      virtualSales: p.virtual_sales || 0,
      shippingTplId: p.shipping_tpl_id || 0,
      freeShipping: p.free_shipping || 0,
      productId: p.product_id,
      picUrl: p.pic_url || "",
      picThumb: p.pic_thumb || "",
      productName: p.product_name || "",
      checkStatus: p.check_status || 0,
      checkReason: p.check_reason || "",
      shopId: p.shop_id || 0,
      suppliersId: p.suppliers_id || 0,
      productType: p.product_type || 0,
      productSn: p.product_sn || "",
      productPrice: money(p.product_price),
      productStatus: p.product_status || 0,
      isBest: p.is_best || 0,
      isNew: p.is_new || 0,
      isHot: p.is_hot || 0,
      productStock: p.product_stock || 0,
      sortOrder: p.sort_order || 0,
      price: money(p.product_price),
      // 字段 is_seckill 不存在于 product 主表（为 order_item 专属），这里保持兼容输出 0
      isSeckill: 0,
      seckillEndTime: "",
      productSku: [],
      shop: null,
    };
  }

  /**
   * 删除浏览历史
   */
  async deleteHistoryProduct(user_id: number, productIds: number[]) {
    // 这里需要实现删除浏览历史功能
    // 实际应该更新用户的history_product_ids字段或浏览历史表

    return {
      status: "success",
      message: "浏览历史删除成功",
    };
  }

  /**
   * 上传用户头像
   */
  async uploadAvatar(user_id: number, file: any) {
    // 为与 PHP /api/user/user/uploadImg 对齐，直接复用 modifyAvatar 的实现与返回结构
    return this.modifyAvatar(user_id, file);
  }

  /**
   * 修改头像 - 对齐PHP版本 modifyAvatar
   */
  async modifyAvatar(user_id: number, file: Express.Multer.File) {
    try {
      // 上传图片
      const uploadDto = {
        type: UploadType.USER,
        relatedId: user_id,
        description: "用户头像",
      };

      const uploadResult = await this.uploadService.uploadFile(
        file,
        uploadDto,
        user_id,
        {
          generateThumbnail: true,
          thumbnailWidth: 200,
          thumbnailHeight: 200,
        },
      );

      // 更新用户头像 - 对齐PHP版本，使用缩略图作为头像
      const avatarUrl = uploadResult.thumbnailUrl || uploadResult.fileUrl;
      await this.databaseService.user.update({
        where: { user_id },
        data: { avatar: avatarUrl },
      });

      this.logger.debug(`用户 ${user_id} 头像修改成功: ${avatarUrl}`);

      return {
        code: 0,
        message: "success",
        data: {
          picThumb: avatarUrl,              // 缩略图（或原图）
          picUrl: uploadResult.fileUrl,     // 原图 URL
          picName: uploadResult.fileName,   // 原始文件名（或唯一名）
          picId: uploadResult.id || 0,      // 主文件记录ID（若存在）
        },
      };
    } catch (error) {
      this.logger.error(`用户 ${user_id} 头像修改失败: ${error.message}`);
      throw new BadRequestException(`头像修改失败: ${error.message}`);
    }
  }

  /**
   * 用户退出登录
   */
  async logout(user_id: number) {
    // 这里可以实现退出登录的逻辑，如清理session等
    return {
      status: "success",
      message: "退出登录成功",
    };
  }

  /**
   * 发送修改密码验证码
   */
  async sendPasswordChangeCode(user_id: number, mobile: string) {
    const user = await this.findById(user_id);

    // 验证手机号是否属于当前用户
    if (user.mobile !== mobile) {
      throw new BadRequestException("手机号不属于当前用户");
    }

    // 生成验证码
    const code = await this.verificationCodeService.generateMobileCode(mobile);

    return {
      status: "success",
      message: "验证码已发送",
      data: { code }, // 生产环境不返回验证码
    };
  }

  /**
   * 验证修改密码验证码
   */
  async checkPasswordChangeCode(user_id: number, mobile: string, code: string) {
    const user = await this.findById(user_id);

    // 验证手机号是否属于当前用户
    if (user.mobile !== mobile) {
      throw new BadRequestException("手机号不属于当前用户");
    }

    // 验证验证码
    const isValidCode = await this.verificationCodeService.validateMobileCode(
      mobile,
      code,
    );
    if (!isValidCode) {
      throw new BadRequestException("验证码错误或已过期");
    }

    return {
      status: "success",
      message: "验证码验证成功",
    };
  }

  /**
   * 获取账户金额变动列表
   */
  async getBalanceLogList(user_id: number, query: any) {
    const page = Math.max(1, Number(query.page) || 1);
    const size = Math.min(100, Math.max(1, Number(query.size) || 15));
    const skip = (page - 1) * size;
    // 仅允许按 log_id / change_time 排序，避免传无效列
    const allowSortFields = new Set(["log_id", "change_time"]);
    const sortField = allowSortFields.has(query.sort_field) ? query.sort_field : "log_id";
    const sortOrderRaw = String(query.sort_order || query.sortOrder || "desc").toLowerCase();
    const sortOrder: any = sortOrderRaw === "asc" ? "asc" : "desc";

    const [balanceLogs, total] = await Promise.all([
      this.databaseService.user_balance_log.findMany({
        where: { user_id },
        orderBy: { [sortField]: sortOrder },
        skip,
        take: size,
      }),
      this.databaseService.user_balance_log.count({ where: { user_id } }),
    ]);

    const toMoney = (v: any) => {
      if (v == null) return "0.00";
      if (typeof v === "number") return v.toFixed(2);
      if (typeof v === "string") return (Number(v) || 0).toFixed(2);
      if (typeof v === "object" && Array.isArray(v.d)) {
        try {
          const digits = (v.d as number[]).join("");
          const e = v.e as number;
          const num = Number(digits) * Math.pow(10, e - digits.length + 1);
          return num.toFixed(2);
        } catch { return "0.00"; }
      }
      return "0.00";
    };
    const records = balanceLogs.map((r: any) => ({
      ...r,
      balance: toMoney(r.balance),
      frozen_balance: toMoney(r.frozen_balance),
      new_balance: toMoney(r.new_balance),
      new_frozen_balance: toMoney(r.new_frozen_balance),
      change_time_format: r.change_time ? new Date(r.change_time * 1000).toISOString().slice(0, 19).replace("T", " ") : "",
    }));

    return {
      status: "success",
      data: {
        records,
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      },
    };
  }

  /**
   * 获取用户等级列表
   */
  async getLevelList() {
    const userRanks = await this.databaseService.user_rank.findMany({
      orderBy: { min_growth_points: "asc" },
    });

    // 读取等级配置 & 成长配置（暂时占位，后续接入配置表/缓存）
    // 与期望示例字段命名：rankConfig / growConfig
    const rankConfigRow = await this.databaseService.user_rank_config.findFirst({
      where: { code: "rank_config" },
      orderBy: { id: "asc" },
    }).catch(() => null);

    const rankConfig = rankConfigRow
      ? {
          id: rankConfigRow.id,
          code: rankConfigRow.code,
          rankType: rankConfigRow.rank_type,
          data: (() => {
            try {
              return rankConfigRow.data ? JSON.parse(rankConfigRow.data) : {};
            } catch (e) {
              return {};
            }
          })(),
        }
      : {};

    // 成长配置暂未建表：使用静态占位结构，后续可改从配置服务获取
    const growConfig = {
      buyOrder: 1,
      buyOrderNumber: 1,
      buyOrderGrowth: 5,
      evpi: 1,
      evpiGrowth: 1,
      bindPhone: 1,
      bindPhoneGrowth: 1,
    };

    const formatMoney2 = (v: any) => {
      const n = Number(v || 0);
      return n.toFixed(2);
    };

    const items = userRanks.map((r) => {
      // rights: 返回空数组（若数据库有 JSON 字符串暂不暴露，保持示例一致）
      return {
        rankId: r.rank_id,
        rankName: r.rank_name,
        minGrowthPoints: formatMoney2(r.min_growth_points), // 转字符串保留2位
        maxGrowthPoints: r.max_growth_points, // 示例里是数字 0
        discount: Number(r.discount || 0).toFixed(1), // 示例显示 "0.0"
        showPrice: r.show_price,
        rankType: 2, // 示例固定为 2，忽略库中 rank_type 原值
        rankLogo: r.rank_logo,
        rankIco: r.rank_ico || "",
        rankBg: r.rank_bg || "",
        rankPoint: r.rank_point || "0",
        freeShipping: r.free_shipping,
        rankCardType: r.rank_card_type,
        rights: [],
        rankLevel: r.rank_level || String(r.rank_id),
      };
    });

    return {
      item: items,
      rankConfig,
      growConfig,
    };
  }

  /**
   * 获取用户等级信息
   */
  async getLevelInfo(rankId: number) {
    const user_rank = await this.databaseService.user_rank.findUnique({
      where: { rank_id: rankId },
    });

    if (!user_rank) {
      throw new NotFoundException("用户等级不存在");
    }

    return {
      status: "success",
      data: user_rank,
    };
  }

  /**
   * 注销账户
   */
  async closeAccount(user_id: number) {
    await this.findById(user_id);

    // 更新用户状态为已注销
    await this.databaseService.user.update({
      where: { user_id },
      data: {
        status: 2, // 假设2表示已注销
      },
    });

    return {
      status: "success",
      message: "账户注销成功",
    };
  }

  /**
   * 获取用户OpenId
   */
  async getUserOpenId(user_id: number) {
    const user_authorize = await this.databaseService.user_authorize.findFirst({
      where: { user_id },
      select: { open_id: true },
    });

    return {
      status: "success",
      data: {
        openid: user_authorize?.open_id || null,
      },
    };
  }
}

// ===== Helpers =====
function maskUsername(s: string) {
  if (!s) return "";
  if (s.length <= 2) return s[0] + "*";
  return s[0] + "***" + s[s.length - 1];
}

function safeJson(str: string | null | undefined) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${y}-${m}-${day}`;
}

function formatUnixTs(ts: number) {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}
