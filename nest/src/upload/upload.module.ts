import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { DatabaseService } from 'src/database/database.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService, DatabaseService],
  exports: [UploadService],
})
export class UploadModule {}