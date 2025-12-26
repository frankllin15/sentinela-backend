import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO base para queries com paginação
 *
 * Todos os DTOs de query que suportam paginação devem estender esta classe.
 * Fornece validação consistente para os parâmetros page e limit.
 *
 * @example
 * export class QueryUserDto extends BasePaginationQueryDto {
 *   @IsOptional()
 *   @IsBoolean()
 *   isActive?: boolean;
 * }
 */
export class BasePaginationQueryDto {
  /**
   * Número da página (1-indexed)
   * @default 1
   * @min 1
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser no mínimo 1' })
  page?: number = 1;

  /**
   * Quantidade de itens por página
   * @default 20
   * @min 1
   * @max 100
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser no mínimo 1' })
  @Max(100, { message: 'Limite deve ser no máximo 100' })
  limit?: number = 20;
}
