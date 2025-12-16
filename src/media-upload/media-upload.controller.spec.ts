import { Test, TestingModule } from '@nestjs/testing';
import { MediaUploadController } from './media-upload.controller';
import { MediaUploadService } from './media-upload.service';

describe('MediaUploadController', () => {
  let controller: MediaUploadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaUploadController],
      providers: [MediaUploadService],
    }).compile();

    controller = module.get<MediaUploadController>(MediaUploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
