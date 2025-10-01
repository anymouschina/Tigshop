import {
  Controller,
  Get,
  Query,
  Request,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { GetProductIdsDto } from "./dto/get-product-ids.dto";
import { RecommendService } from "./recommend.service";
import { ProductService } from "../../product/product.service";

@Controller("api/common/recommend")
export class RecommendController {
  constructor(
    private readonly recommendService: RecommendService,
    private readonly productService: ProductService,
  ) {}

  @Get("getProductIds")
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  )
  async getProductIds(@Query() query: GetProductIdsDto, @Request() req: any) {
    const userId = req.user?.userId; // 从JWT token中获取用户ID

    const productIds = await this.recommendService.getProductIds(
      query.page,
      query.size,
      userId,
    );
    return { code: 0, message: "success", data: productIds };
  }

  /**
   * 猜你喜欢 - 对齐 PHP: /api/common/recommend/guessLike
   * 支持参数：page, size, ids, category_id, brand_id, intro_type(hot|best|new), sort_field, sort_order
   */
  @Get("guessLike")
  async guessLike(@Query() query: any) {
    // 将 PHP 风格参数映射到 ProductService.findAll 的入参
    const snakeToCamelSort: Record<string, string> = {
      product_id: "productId",
      product_price: "productPrice",
      product_stock: "productStock",
      virtual_sales: "virtualSales",
      sort_order: "sortOrder",
      add_time: "addTime",
      last_update: "lastUpdate",
      product_status: "productStatus",
      click_count: "clickCount",
    };

    const sortFieldRaw = query.sort_field?.toString();
    const mapped: any = {
      page: toNumber(query.page, 1),
      size: toNumber(query.size, 15),
      ids: query.ids,
      categoryId: toNumber(query.category_id),
      brandId: toNumber(query.brand_id),
      sortField: sortFieldRaw ? snakeToCamelSort[sortFieldRaw] || sortFieldRaw : "productId",
      sortOrder: (query.sort_order?.toString().toLowerCase() === "asc" ? "asc" : "desc") as "asc" | "desc",
    };

    // intro_type -> isHot/isBest/isNew
    const intro = query.intro_type?.toString().toLowerCase();
    if (intro === "hot") mapped.isHot = true;
    if (intro === "best") mapped.isBest = true;
    if (intro === "new") mapped.isNew = true;

    const data = await this.productService.findAll(mapped);
    return { code: 0, message: "success", data };

    function toNumber(v: any, def?: number) {
      if (v === undefined || v === null || v === "") return def;
      const n = Number(v);
      return Number.isNaN(n) ? def : n;
    }
  }
}
