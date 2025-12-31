import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchByFaceDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O limite deve ser um número' })
  @Min(1, { message: 'O limite mínimo é 1' })
  @Max(50, { message: 'O limite máximo é 50' })
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O threshold deve ser um número' })
  @Min(0, { message: 'O threshold mínimo é 0' })
  @Max(1, { message: 'O threshold máximo é 1' })
  threshold?: number = 0.5;
}
