import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { AuditStatus } from '../entities/audit.entity';

export class CreateAuditDto {
  @IsNotEmpty({ message: 'Ação é obrigatória' })
  @IsString({ message: 'Ação deve ser um texto' })
  @MaxLength(255, { message: 'Ação deve ter no máximo 255 caracteres' })
  action: string;

  @IsOptional()
  @IsInt({ message: 'ID do usuário deve ser um número inteiro' })
  userId?: number | null;

  @IsNotEmpty({ message: 'Entidade alvo é obrigatória' })
  @IsString({ message: 'Entidade alvo deve ser um texto' })
  @MaxLength(255, {
    message: 'Entidade alvo deve ter no máximo 255 caracteres',
  })
  targetEntity: string;

  @IsOptional()
  details?: Record<string, any>;

  @IsOptional()
  @IsString({ message: 'Endereço IP deve ser um texto' })
  @MaxLength(45, { message: 'Endereço IP deve ter no máximo 45 caracteres' })
  ipAddress?: string | null;

  @IsOptional()
  @IsEnum(AuditStatus, { message: 'Status deve ser success ou failure' })
  status?: AuditStatus;
}
