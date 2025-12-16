import { Module } from '@nestjs/common';
import { MediaUploadService } from './media-upload.service';
import { MediaUploadController } from './media-upload.controller';
import { StorageService } from 'src/common/services/storage.service';

@Module({
  controllers: [MediaUploadController],
  providers: [MediaUploadService, StorageService],
})
export class MediaUploadModule {}
