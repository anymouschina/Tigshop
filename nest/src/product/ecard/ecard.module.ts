// @ts-nocheck
import { Module } from "@nestjs/common";
import { ECardController } from "./ecard.controller";
import { ECardService } from "./ecard.service";
import { PrismaModule } from "../../common/services/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ECardController],
  providers: [ECardService],
  exports: [ECardService],
})
export class ECardModule {}
