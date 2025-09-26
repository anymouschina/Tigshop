import { Controller, Get, Query, Request, UsePipes, ValidationPipe } from '@nestjs/common';
import { GetProductIdsDto } from './dto/get-product-ids.dto';
import { RecommendService } from './recommend.service';
import { camelCase } from '../utils/camel-case.util';

@Controller('common/recommend')
export class RecommendController {
  constructor(private readonly recommendService: RecommendService) {}

  @Get('getProductIds')
  @UsePipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false
  }))
  async getProductIds(@Query() query: GetProductIdsDto, @Request() req: any) {
    const userId = req.user?.userId; // 从JWT token中获取用户ID

    const productIds = await this.recommendService.getProductIds(query.page, query.size, userId);

    return {
      code: 0,
      data: camelCase(productIds),
      message: 'success',
    };
  }
}