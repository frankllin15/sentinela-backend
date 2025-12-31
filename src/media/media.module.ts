import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { Media } from './entities/media.entity';
import { PeopleModule } from '../people/people.module';
import { CommonModule } from '../common/common.module';
import { FaceRecognitionService } from './services/face-recognition.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media]),
    forwardRef(() => PeopleModule),
    CommonModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [MediaController],
  providers: [MediaService, FaceRecognitionService],
  exports: [MediaService, FaceRecognitionService],
})
export class MediaModule {}
