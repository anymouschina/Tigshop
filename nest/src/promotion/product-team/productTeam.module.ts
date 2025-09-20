// @ts-nocheck
import { Module } from '@nestjs/common';
import { ProductTeamService } from './productTeam.service';
import { ProductTeamController } from './productTeam.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductTeamController],
  providers: [ProductTeamService],
  exports: [ProductTeamService],
})
export class ProductTeamModule {}
