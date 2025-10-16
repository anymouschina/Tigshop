import { Body, Controller, Post } from "@nestjs/common";
import { ImServantService } from "./im_servant.service";

// 路径对齐请求: /im/servant/servant/modifyStatus
@Controller("im/servant/servant")
export class ImServantController {
  constructor(private service: ImServantService) {}

  @Post("modifyStatus")
  async modifyStatus(@Body() body: any) {
    const result = await this.service.modifyStatus({
      servantId: body.servantId ? Number(body.servantId) : 0,
      shopId: body.shopId ? Number(body.shopId) : 0,
      status: body.status !== undefined ? Number(body.status) : 0,
    });
    return { code: 0, message: "success", data: result };
  }
}
