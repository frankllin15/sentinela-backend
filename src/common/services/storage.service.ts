import { Inject, Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { StorageFolder } from '../enums/storage-folder.enum';
import r2Config from 'src/config/r2.config';
import type { ConfigType } from '@nestjs/config';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName = process.env.R2_BUCKET_NAME;
  private publicUrl = process.env.R2_PUBLIC_URL; // Ex: https://media.sentinela.com

  constructor(
    @Inject(r2Config.KEY)
    private readonly r2Configuration: ConfigType<typeof r2Config>,
  ) {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.r2Configuration.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.r2Configuration.accessKeyId,
        secretAccessKey: this.r2Configuration.secretAccessKey,
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: StorageFolder,
  ): Promise<string> {
    const fileExtension = extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;

    // Cria o caminho com a pasta: "faces/uuid-123.jpg"
    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);

      // Retorna a URL pública completa
      return `${this.publicUrl}/${key}`;
    } catch (error) {
      console.error('Erro upload R2:', error);
      throw new Error('Falha ao salvar arquivo no storage');
    }
  }
}
