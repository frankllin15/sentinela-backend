import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { StorageService } from '../common/services/storage.service';
import { StorageFolder } from 'src/common/enums/storage-folder.enum';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('upload')
export class MediaUploadController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          // Aceita imagens E PDFs (para mandados)
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|pdf)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('category') category: string, // Recebe a categoria do Front
  ) {
    // Mapeamento simples de string para o Enum de pastas
    let folder: StorageFolder;

    switch (category) {
      case 'FACE':
        folder = StorageFolder.FACES;
        break;
      case 'FULL_BODY':
        folder = StorageFolder.BODIES;
        break;
      case 'TATTOO':
        folder = StorageFolder.TATTOOS;
        break;
      case 'WARRANT': // Caso seja mandado
        folder = StorageFolder.DOCUMENTS;
        break;
      default:
        folder = StorageFolder.OTHERS;
    }

    const url = await this.storageService.uploadFile(file, folder);
    return { url };
  }
}
