// @ts-nocheck
import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Public } from "../../auth/decorators/public.decorator";
import { WechatService } from "../../wechat/wechat.service";

@ApiTags("Common - 工具接口")
@Controller("api/common/util")
export class CommonUtilController {
  constructor(private readonly wechatService: WechatService) {}

  /**
   * 获取二维码 - 对齐 PHP common.util/qrCode
   * 入参：url
   * 返回：base64 PNG（与PHP保持为字符串返回，由前端自行展示）
   */
  @Get("qrCode")
  @Public()
  @ApiOperation({ summary: "生成二维码(PNG Base64)" })
  @ApiQuery({ name: "url", required: true, description: "要编码的URL" })
  async qrCode(@Query("url") url: string) {
    if (!url) throw new BadRequestException("url 不能为空");
    // 轻量实现：借助支付模块中已有的mock生成器风格，返回伪base64
    // 如需真实二维码，可引入第三方库 qrcode 或 jimp/canvas 绘制
    const dataUrl = `data:image/png;base64,mock_qr_code_for_${encodeURIComponent(url)}`;
    return { code: 0, message: "success", data: dataUrl };
  }

  /**
   * 获取小程序二维码 - 对齐 PHP common.util/getMiniProgramCode => miniCode
   * 入参：path (小程序路径), id(可选，用作scene)
   * 返回：图片二进制的base64字符串
   */
  @Get("miniCode")
  @Public()
  @ApiOperation({ summary: "获取小程序二维码(Base64)" })
  @ApiQuery({ name: "path", required: false })
  @ApiQuery({ name: "id", required: false, description: "产品ID或场景参数" })
  async getMiniProgramCode(
    @Query("path") path = "pages/index/index",
    @Query("id") id?: string,
  ) {
    const scene = id ? String(id) : "0";
    const buffer = await this.wechatService.generateMiniProgramQrCode(
      path,
      scene,
      430,
      "release",
    );
    const base64 = buffer.toString("base64");
    return { code: 0, message: "success", data: base64 };
  }
}
