import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPersonDto {
  @IsOptional()
  @IsString({ message: 'Nome completo deve ser um texto' })
  fullName?: string;

  @IsOptional()
  @IsString({ message: 'Apelido deve ser um texto' })
  nickname?: string;

  @IsOptional()
  @IsString({ message: 'CPF deve ser um texto' })
  cpf?: string;

  @IsOptional()
  @IsString({ message: 'Nome da mãe deve ser um texto' })
  motherName?: string;

  @IsOptional()
  @IsString({ message: 'Nome do pai deve ser um texto' })
  fatherName?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'isConfidential deve ser um booleano' })
  isConfidential?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID do criador deve ser um número inteiro' })
  createdBy?: number;

  // Paginação
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser no mínimo 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser no mínimo 1' })
  @Max(100, { message: 'Limite deve ser no máximo 100' })
  limit?: number = 20;
}
