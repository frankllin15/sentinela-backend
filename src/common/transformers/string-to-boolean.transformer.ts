import { TransformFnParams } from 'class-transformer';

/**
 * Transformer para converter strings truthy em booleanos.
 * Utilizado em DTOs para aceitar valores de query parameters ou form data.
 *
 * Conversões:
 * - Strings "true", "1", "yes" (case-insensitive) → true
 * - Outras strings → false
 * - Números: 0 → false, outros → true
 * - Booleanos: mantém o valor
 * - undefined/null: mantém o valor
 *
 * @example
 * ```typescript
 * export class MyDto {
 *   @Transform(stringToBooleanTransformer)
 *   @IsBoolean()
 *   isActive?: boolean;
 * }
 * ```
 */
export function stringToBooleanTransformer({ value }: TransformFnParams) {
  if (value === undefined || value === null) return value;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase().trim();
    return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
  }
  if (typeof value === 'number') return value !== 0;
  return Boolean(value);
}
