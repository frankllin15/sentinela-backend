import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { stringToBooleanTransformer } from '../../common/transformers';
import { BasePaginationQueryDto } from '../../common/dto';

export class QueryPersonDto extends BasePaginationQueryDto {
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
  @Transform(stringToBooleanTransformer)
  @IsBoolean({ message: 'isConfidential deve ser um booleano' })
  isConfidential?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID do criador deve ser um número inteiro' })
  createdBy?: number;
}
