import { Module, Global } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],  // ✅ 不要用 useFactory/new PrismaService()
  exports: [PrismaService],
})
export class PrismaModule {}
