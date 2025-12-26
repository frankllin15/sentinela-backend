import { IsOptional, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { MediaType } from '../entities/media.entity';
import { BasePaginationQueryDto } from '../../common/dto';

export class QueryMediaDto extends BasePaginationQueryDto {
  @IsOptional()
  @IsEnum(MediaType, {
    message: 'Tipo de mídia inválido. Use: FACE, FULL_BODY ou TATTOO',
  })
  type?: MediaType;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O ID da pessoa deve ser um número inteiro' })
  personId?: number;

  // Sobrescrever limite padrão para 10 (manter compatibilidade)
  limit?: number = 10;
}
