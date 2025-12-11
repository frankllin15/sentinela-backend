import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateForceDto {
  @IsNotEmpty({ message: 'O nome da força policial é obrigatório' })
  @IsString({ message: 'O nome deve ser um texto' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres' })
  name: string;
}
