import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { stringToBooleanTransformer } from '../../common/transformers';
import { BasePaginationQueryDto } from '../../common/dto';

export class QueryUserDto extends BasePaginationQueryDto {
  @IsOptional()
  @Transform(stringToBooleanTransformer)
  @IsBoolean({ message: 'isActive deve ser um booleano' })
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID da força policial deve ser um número inteiro' })
  forceId?: number;
}
