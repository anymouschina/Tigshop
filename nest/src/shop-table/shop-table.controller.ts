// @ts-nocheck
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  Query,
  UseGuards,
  Res,
} from "@nestjs/common";
import { ShopTableService } from "./shop-table.service";
import { CreateShopTableDto, UpdateShopTableDto } from "./dto/shop-table.dto";
import { AdminJwtAuthGuard } from "src/auth/guards/admin-jwt-auth.guard";
import { AuthorityGuard } from "src/auth/guards/authority.guard";
import { Authorities } from "src/auth/decorators/authority.decorator";
import { WechatService } from "src/wechat/wechat.service";
import { Response } from "express";

// 命名遵循现有 admin 兼容风格：路径前缀 adminapi/...  & 类名 *CompatController
@Controller("adminapi/shopTable")
@UseGuards(AdminJwtAuthGuard, AuthorityGuard)
export class AdminShopTableCompatController {
  constructor(
    private readonly service: ShopTableService,
    private readonly wechat: WechatService,
  ) {}

  // POST /adminapi/shopTable/create
  @Post("create")
  @Authorities("shopTableManage")
  async create(@Body() dto: CreateShopTableDto) {
    const data = await this.service.create(dto);
    return { code: 0, message: "success", data };
  }

  // GET /adminapi/shopTable/list?shopId=1
  @Get("list")
  @Authorities("shopTableManage")
  async list(@Query("shopId") shopId: number) {
    const data = await this.service.list(Number(shopId));
    return { code: 0, message: "success", data: { records: data } };
  }

  // PUT /adminapi/shopTable/update/123
  @Put("update/:id")
  @Authorities("shopTableManage")
  async update(@Param("id") id: number, @Body() dto: UpdateShopTableDto) {
    const data = await this.service.update(Number(id), dto);
    return { code: 0, message: "success", data };
  }

  // DELETE /adminapi/shopTable/delete/123
  @Delete("delete/:id")
  @Authorities("shopTableManage")
  async remove(@Param("id") id: number) {
    const data = await this.service.remove(Number(id));
    return { code: 0, message: "success", data };
  }

  // GET /adminapi/shopTable/qrcode?id=1 或 ?key=STxxxx  返回二维码图片
  @Get("qrcode")
  @Authorities("shopTableManage")
  async qrcodeAuth(
    @Query("id") id: number,
    @Query("key") key: string,
    @Query("env") env: string,
    @Res() res: Response,
  ) {
    let table;
    if (id) {
      table = await this.service.detail(Number(id));
    } else if (key) {
      table = await this.service.findByQr(key);
    }
    if (!table) {
      return res
        .status(404)
        .json({ code: 404, message: "桌号不存在或未匹配", data: null });
    }
    if (!table.qr_code_key) {
      return res
        .status(404)
        .json({ code: 404, message: "桌号暂无二维码Key", data: null });
    }
    // 允许通过环境变量覆盖小程序落地页（解决某些构建尚未注册新页面导致的“页面未找到”问题）
    const page = process.env.DINE_QR_PAGE || "pages/dine/index";
    const scene = `t=${table.qr_code_key}`;
    const envVersion = env === "trial" || env === "develop" ? env : "release";
    const buf = await this.wechat.generateMiniProgramQrCode(
      page,
      scene,
      430,
      envVersion,
    );
    res.setHeader("Content-Type", "image/jpeg");
    res.send(buf);
  }
}

// 公开二维码（供前台或未登录场景直接访问，不走权限守卫）
@Controller("qrcode")
export class PublicQrcodeController {
  constructor(
    private readonly service: ShopTableService,
    private readonly wechat: WechatService,
  ) {}

  // GET /qrcode/table?id=1  或 /qrcode/table?key=STXXXX  -> 直接输出二维码图片
  @Get("table")
  async publicTable(
    @Query("id") id: number,
    @Query("key") key: string,
    @Query("env") env: string,
    @Res() res: Response,
  ) {
    let table;
    if (id) {
      table = await this.service.detail(Number(id));
    } else if (key) {
      table = await this.service.findByQr(key);
    }
    if (!table) {
      return res.status(404).json({ code: 404, message: "桌号不存在或未匹配" });
    }
    if (!table.qr_code_key) {
      return res.status(404).json({ code: 404, message: "桌号暂无二维码Key" });
    }
    const page = process.env.DINE_QR_PAGE || "pages/dine/index";
    const scene = `t=${table.qr_code_key}`;
    const envVersion = env === "trial" || env === "develop" ? env : "release";
    const buf = await this.wechat.generateMiniProgramQrCode(
      page,
      scene,
      430,
      envVersion,
    );
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(buf);
  }

  // GET /qrcode/table/resolve?key=STXXXX  -> 返回桌号及店铺信息（小程序扫码后跳转使用）
  @Get("table/resolve")
  async resolve(@Query("key") key: string, @Res() res: Response) {
    if (!key) {
      return res.status(400).json({ code: 400, message: "缺少参数 key" });
    }
    const table = await this.service.findByQr(key);
    if (!table) {
      return res.status(404).json({ code: 404, message: "未找到匹配桌号" });
    }
    return res.json({
      code: 0,
      message: "success",
      data: {
        id: table.id,
        shopId: table.shop_id,
        tableNo: table.table_no,
        area: table.area,
        capacity: table.capacity,
        qrCodeKey: table.qr_code_key,
      },
    });
  }
}
