import { Injectable } from '@nestjs/common';
import { PaginatedResponse } from '../dto/paginated-response.dto';

/**
 * Serviço helper para formatar respostas paginadas
 *
 * Centraliza a lógica de criação de objetos PaginatedResponse,
 * garantindo consistência no cálculo de totalPages em toda a aplicação.
 */
@Injectable()
export class PaginationService {
  /**
   * Formata dados paginados no padrão PaginatedResponse
   *
   * @template T - Tipo dos itens de dados
   * @param data - Array de itens da página atual
   * @param total - Total de itens em todas as páginas
   * @param page - Número da página atual (1-indexed)
   * @param limit - Quantidade de itens por página
   * @returns Objeto formatado com metadados de paginação
   *
   * @example
   * const [users, total] = await this.userRepository.findAndCount({...});
   * return this.paginationService.paginate(users, total, page, limit);
   */
  paginate<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResponse<T> {
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
