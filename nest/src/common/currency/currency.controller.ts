// @ts-nocheck
import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../../auth/decorators/public.decorator";
import { PrismaService } from "../../prisma/prisma.service";

@ApiTags("Common - 货币")
@Controller("api/common/currency")
export class CurrencyController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获得货币列表 - 对齐 PHP: /api/common/currency/getCurrency
   */
  @Get("getCurrency")
  @Public()
  @ApiOperation({ summary: "获得货币列表" })
  async getCurrency() {
    const records = await this.prisma.currency.findMany({
      orderBy: [{ is_default: "desc" }, { id: "asc" }],
    });
    return { code: 0, message: "success", data: records };
  }
}
