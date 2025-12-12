import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuditStatus } from '../entities/audit.entity';

export class QueryAuditDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID do usuário deve ser um número inteiro' })
  userId?: number;

  @IsOptional()
  @IsString({ message: 'Ação deve ser um texto' })
  action?: string;

  @IsOptional()
  @IsString({ message: 'Entidade alvo deve ser um texto' })
  targetEntity?: string;

  @IsOptional()
  @IsEnum(AuditStatus, { message: 'Status deve ser success ou failure' })
  status?: AuditStatus;

  @IsOptional()
  @IsDateString({}, { message: 'Data inicial deve estar no formato ISO 8601' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Data final deve estar no formato ISO 8601' })
  endDate?: string;

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
