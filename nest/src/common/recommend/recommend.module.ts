import { Module } from "@nestjs/common";
import { RecommendController } from "./recommend.controller";
import { RecommendService } from "./recommend.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { ProductModule } from "../../product/product.module";

@Module({
  imports: [PrismaModule, ProductModule],
  controllers: [RecommendController],
  providers: [RecommendService],
  exports: [RecommendService],
})
export class RecommendModule {}
