import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MediaType } from '../entities/media.entity';

export class QueryMediaDto {
  @IsOptional()
  @IsEnum(MediaType, {
    message: 'Tipo de mídia inválido. Use: FACE, FULL_BODY ou TATTOO',
  })
  type?: MediaType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O ID da pessoa deve ser um número' })
  personId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'A página deve ser um número' })
  @Min(1, { message: 'A página deve ser no mínimo 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O limite deve ser um número' })
  @Min(1, { message: 'O limite deve ser no mínimo 1' })
  limit?: number = 10;
}
