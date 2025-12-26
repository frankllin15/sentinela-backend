/**
 * Interface genérica para respostas paginadas
 *
 * @template T - Tipo dos itens retornados na lista de dados
 *
 * @example
 * // Uso em serviços
 * async findAll(): Promise<PaginatedResponse<User>> {
 *   const [data, total] = await this.repository.findAndCount();
 *   return this.paginationService.paginate(data, total, page, limit);
 * }
 */
export interface PaginatedResponse<T> {
  /** Array de itens da página atual */
  data: T[];

  /** Total de itens em todas as páginas */
  total: number;

  /** Número da página atual (1-indexed) */
  page: number;

  /** Quantidade de itens por página */
  limit: number;

  /** Total de páginas (calculado como Math.ceil(total / limit)) */
  totalPages: number;
}
