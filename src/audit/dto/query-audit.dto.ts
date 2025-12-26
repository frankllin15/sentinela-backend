import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuditStatus } from '../entities/audit.entity';
import { BasePaginationQueryDto } from '../../common/dto';

export class QueryAuditDto extends BasePaginationQueryDto {
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
}
