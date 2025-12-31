import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import FormData from 'form-data';

interface ExtractEmbeddingResponse {
  embedding: number[];
}

@Injectable()
export class FaceRecognitionService {
  private readonly logger = new Logger(FaceRecognitionService.name);
  private readonly apiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>('FACE_RECOGNITION_API_URL')!;
  }

  /**
   * Extrai embedding de uma imagem facial a partir de um Buffer
   * @param imageBuffer Buffer contendo os dados da imagem
   * @param contentType MIME type da imagem (padrão: image/jpeg)
   * @returns Array de números representando o embedding (dimensão 128), ou null se falhar
   */
  async extractEmbeddingFromBuffer(
    imageBuffer: Buffer,
    contentType: string = 'image/jpeg',
  ): Promise<number[] | null> {
    try {
      this.logger.log(
        `Extraindo embedding de buffer (${imageBuffer.length} bytes)`,
      );

      // 1. Criar FormData com o arquivo
      const formData = new FormData();
      formData.append('file', imageBuffer, {
        filename: 'image.jpg',
        contentType,
      });

      // 2. Enviar para API de reconhecimento facial
      this.logger.debug('Enviando para serviço de reconhecimento...');
      const response = await firstValueFrom(
        this.httpService.post<ExtractEmbeddingResponse>(
          `${this.apiUrl}/api/v1/embeddings/extract`,
          formData,
          {
            headers: formData.getHeaders(),
            timeout: 60000, // 60 segundos timeout
          },
        ),
      );

      const { embedding } = response.data;

      // 3. Validar resposta
      if (!embedding || !Array.isArray(embedding)) {
        this.logger.error('Resposta inválida: embedding não é um array');
        return null;
      }

      // Validar dimensão esperada (128)
      if (embedding.length !== 128) {
        this.logger.warn(
          `Embedding com dimensão inesperada: ${embedding.length} (esperado: 128)`,
        );
      }

      this.logger.log(
        `Embedding extraído com sucesso (dimensão: ${embedding.length})`,
      );
      return embedding;
    } catch (error) {
      // Log do erro mas NÃO lançar exceção
      this.logger.error(
        `Erro ao extrair embedding: ${error.message}`,
        error.stack,
      );

      // Retornar null
      return null;
    }
  }

  /**
   * Extrai embedding de uma imagem facial a partir de URL
   * @param imageUrl URL da imagem a ser baixada e processada
   * @returns Array de números representando o embedding (dimensão 128), ou null se falhar
   */
  async extractEmbedding(imageUrl: string): Promise<number[] | null> {
    try {
      this.logger.log(`Extraindo embedding para imagem: ${imageUrl}`);

      // 1. Baixar a imagem da URL
      this.logger.debug('Baixando imagem...');
      const imageResponse = await firstValueFrom(
        this.httpService.get(imageUrl, {
          responseType: 'arraybuffer',
          timeout: 10000, // 10 segundos para download
        }),
      );

      const imageBuffer = Buffer.from(imageResponse.data);
      const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
      this.logger.debug(`Imagem baixada (${imageBuffer.length} bytes)`);

      // 2. Delegar para o método que processa buffer
      return this.extractEmbeddingFromBuffer(imageBuffer, contentType);
    } catch (error) {
      // Log do erro mas NÃO lançar exceção
      this.logger.error(
        `Erro ao baixar imagem da URL: ${error.message}`,
        error.stack,
      );

      // Retornar null para que a media seja criada sem embedding
      return null;
    }
  }

  /**
   * Verifica se o serviço de reconhecimento está disponível
   * @returns true se disponível, false caso contrário
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/health`, { timeout: 5000 }),
      );
      return true;
    } catch {
      this.logger.warn('Serviço de reconhecimento facial indisponível');
      return false;
    }
  }
}
