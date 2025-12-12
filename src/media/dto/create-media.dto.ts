import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  IsNumber,
} from 'class-validator';
import { MediaType } from '../entities/media.entity';

export class CreateMediaDto {
  @IsNotEmpty({ message: 'O tipo de mídia é obrigatório' })
  @IsEnum(MediaType, {
    message: 'Tipo de mídia inválido. Use: FACE, FULL_BODY ou TATTOO',
  })
  type: MediaType;

  @IsNotEmpty({ message: 'A URL da mídia é obrigatória' })
  @IsString({ message: 'A URL deve ser um texto' })
  @MaxLength(500, { message: 'A URL deve ter no máximo 500 caracteres' })
  url: string;

  @IsOptional()
  @IsString({ message: 'O rótulo deve ser um texto' })
  @MaxLength(100, { message: 'O rótulo deve ter no máximo 100 caracteres' })
  label?: string;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto' })
  description?: string;

  @IsNotEmpty({ message: 'O ID da pessoa é obrigatório' })
  @IsNumber({}, { message: 'O ID da pessoa deve ser um número' })
  personId: number;
}
