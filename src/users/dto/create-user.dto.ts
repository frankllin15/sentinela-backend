import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsInt,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MaxLength(100, { message: 'Nome deve ter no máximo 100 caracteres' })
  name: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  @MaxLength(100, { message: 'Senha deve ter no máximo 100 caracteres' })
  @Matches(/^\d{6}$/, {
    message: 'Senha inicial deve conter exatamente 6 dígitos numéricos',
  })
  password: string;

  @IsEnum(UserRole, {
    message: 'Função deve ser: admin_geral, ponto_focal, gestor ou usuario',
  })
  @IsNotEmpty({ message: 'Função é obrigatória' })
  role: UserRole;

  @IsOptional()
  @IsInt({ message: 'ID da força deve ser um número inteiro' })
  forceId?: number;
}
