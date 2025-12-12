import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePersonDto {
  // Identificação
  @IsNotEmpty({ message: 'Nome completo é obrigatório' })
  @IsString({ message: 'Nome completo deve ser um texto' })
  @MaxLength(255, {
    message: 'Nome completo deve ter no máximo 255 caracteres',
  })
  fullName: string;

  @IsOptional()
  @IsString({ message: 'Apelido deve ser um texto' })
  @MaxLength(100, { message: 'Apelido deve ter no máximo 100 caracteres' })
  nickname?: string;

  @IsOptional()
  @IsString({ message: 'CPF deve ser um texto' })
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, {
    message: 'CPF deve estar no formato 000.000.000-00 ou 00000000000',
  })
  @MaxLength(14, { message: 'CPF deve ter no máximo 14 caracteres' })
  cpf?: string;

  @IsOptional()
  @IsString({ message: 'RG deve ser um texto' })
  @MaxLength(20, { message: 'RG deve ter no máximo 20 caracteres' })
  rg?: string;

  @IsOptional()
  @IsString({ message: 'Título de eleitor deve ser um texto' })
  @MaxLength(20, {
    message: 'Título de eleitor deve ter no máximo 20 caracteres',
  })
  voterId?: string;

  // Localização
  @IsNotEmpty({ message: 'Endereço principal é obrigatório' })
  @IsString({ message: 'Endereço principal deve ser um texto' })
  addressPrimary: string;

  @IsOptional()
  @IsString({ message: 'Endereço secundário deve ser um texto' })
  addressSecondary?: string;

  @IsNotEmpty({ message: 'Latitude é obrigatória' })
  @IsNumber({}, { message: 'Latitude deve ser um número' })
  @Min(-90, { message: 'Latitude deve ser no mínimo -90' })
  @Max(90, { message: 'Latitude deve ser no máximo 90' })
  latitude: number;

  @IsNotEmpty({ message: 'Longitude é obrigatória' })
  @IsNumber({}, { message: 'Longitude deve ser um número' })
  @Min(-180, { message: 'Longitude deve ser no mínimo -180' })
  @Max(180, { message: 'Longitude deve ser no máximo 180' })
  longitude: number;

  // Filiação
  @IsOptional()
  @IsString({ message: 'Nome da mãe deve ser um texto' })
  @MaxLength(255, { message: 'Nome da mãe deve ter no máximo 255 caracteres' })
  motherName?: string;

  @IsOptional()
  @IsString({ message: 'Nome do pai deve ser um texto' })
  @MaxLength(255, { message: 'Nome do pai deve ter no máximo 255 caracteres' })
  fatherName?: string;

  // Mandado
  @IsOptional()
  @IsString({ message: 'Status do mandado deve ser um texto' })
  warrantStatus?: string;

  @IsOptional()
  @IsUrl({}, { message: 'URL do arquivo do mandado deve ser uma URL válida' })
  warrantFileUrl?: string;

  // Metadados
  @IsOptional()
  @IsString({ message: 'Observações devem ser um texto' })
  notes?: string;

  @IsOptional()
  @IsBoolean({ message: 'isConfidential deve ser um booleano' })
  isConfidential?: boolean;
}
