import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Exception customizada para erros de regra de negócio
 *
 * Características:
 * - Sempre user-facing (mensagens seguras para exibição ao usuário)
 * - Mensagens claras e acionáveis em português
 * - Inclui código de erro para tratamento programático no frontend
 *
 * Uso recomendado:
 * - Validações de regras de negócio
 * - Recursos não encontrados
 * - Conflitos de dados (duplicação)
 * - Operações não permitidas
 * - Erros de permissão
 */
export class BusinessException extends HttpException {
  constructor(
    public readonly message: string,
    public readonly errorCode: string,
    public readonly statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, statusCode);
    this.name = 'BusinessException';
  }

  /**
   * Factory method para erros de recurso não encontrado
   *
   * @param entity Nome da entidade (ex: 'Usuário', 'Força Policial')
   * @param id ID do recurso não encontrado
   * @returns BusinessException com status 404
   *
   * @example
   * throw BusinessException.notFound('Usuário', 123);
   * // Retorna: "Usuário com ID 123 não encontrado" (404)
   */
  static notFound(entity: string, id: number | string): BusinessException {
    return new BusinessException(
      `${entity} com ID ${id} não encontrado`,
      `${entity.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`,
      HttpStatus.NOT_FOUND,
    );
  }

  /**
   * Factory method para erros de recurso já existente (duplicação)
   *
   * @param entity Nome da entidade (ex: 'Usuário', 'Força Policial')
   * @param field Campo que está duplicado (ex: 'email', 'CPF', 'nome')
   * @returns BusinessException com status 409
   *
   * @example
   * throw BusinessException.alreadyExists('Usuário', 'email');
   * // Retorna: "Usuário com este email já existe" (409)
   */
  static alreadyExists(entity: string, field: string): BusinessException {
    return new BusinessException(
      `${entity} com este ${field} já existe`,
      `${entity.toUpperCase().replace(/\s+/g, '_')}_ALREADY_EXISTS`,
      HttpStatus.CONFLICT,
    );
  }

  /**
   * Factory method para erros de permissão/acesso negado
   *
   * @param message Mensagem descrevendo o que não é permitido
   * @returns BusinessException com status 403
   *
   * @example
   * throw BusinessException.forbidden('Você não tem permissão para acessar este registro confidencial');
   * // Retorna: mensagem customizada (403)
   */
  static forbidden(message: string): BusinessException {
    return new BusinessException(message, 'FORBIDDEN', HttpStatus.FORBIDDEN);
  }

  /**
   * Factory method para erros de operação inválida ou regra de negócio violada
   *
   * @param message Mensagem descrevendo a regra de negócio violada
   * @returns BusinessException com status 400
   *
   * @example
   * throw BusinessException.invalidOperation('Usuários que não são admin_geral devem estar associados a uma força policial');
   * // Retorna: mensagem customizada (400)
   */
  static invalidOperation(message: string): BusinessException {
    return new BusinessException(
      message,
      'INVALID_OPERATION',
      HttpStatus.BAD_REQUEST,
    );
  }

  /**
   * Factory method para erros de autenticação
   *
   * @param message Mensagem de erro de autenticação (opcional)
   * @returns BusinessException com status 401
   *
   * @example
   * throw BusinessException.unauthorized('Credenciais inválidas');
   * // Retorna: "Credenciais inválidas" (401)
   */
  static unauthorized(message: string = 'Não autorizado'): BusinessException {
    return new BusinessException(
      message,
      'UNAUTHORIZED',
      HttpStatus.UNAUTHORIZED,
    );
  }
}
