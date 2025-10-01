// @ts-nocheck
import { Controller, Get, Query } from "@nestjs/common";
import { Public } from "../auth/decorators/public.decorator";

@Controller("api/search/searchGuess")
export class SearchGuessController {
  /**
   * 关键词联想 - 对齐PHP版本 search/searchGuess/index
   */
  @Get("index")
  @Public()
  async index(@Query("keyword") keyword: string = "") {
    const base = [
      "手机",
      "电脑",
      "耳机",
      "蓝牙",
      "键盘",
      "显示器",
      "路由器",
      "相机",
      "充电器",
      "钢化膜",
    ];
    const list = base
      .filter((x) => !keyword || x.includes(keyword))
      .slice(0, 10)
      .map((name, idx) => ({ id: idx + 1, name }));
    return list;
  }
}
