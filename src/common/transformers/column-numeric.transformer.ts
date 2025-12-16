/**
 * Transformer para colunas numéricas no banco de dados.
 * Garante que valores lidos do banco sejam convertidos de string para número.
 */
export class ColumnNumericTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseFloat(data); // Converte string para número ao ler do banco
  }
}
