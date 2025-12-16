/**
 * DTO padrão para todas as respostas de erro da aplicação
 * Garante consistência e permite ao frontend distinguir erros user-facing de erros técnicos
 */
export class ErrorResponseDto {
  /**
   * Código de status HTTP
   */
  statusCode: number;

  /**
   * Timestamp ISO string da ocorrência do erro
   */
  timestamp: string;

  /**
   * Path da requisição que gerou o erro
   */
  path: string;

  /**
   * Método HTTP da requisição (GET, POST, etc)
   */
  method: string;

  /**
   * Código do erro para tratamento programático
   * Ex: 'USER_NOT_FOUND', 'VALIDATION_ERROR', 'UNAUTHORIZED'
   */
  errorCode: string;

  /**
   * Mensagem de erro em português
   * Pode ser string única ou array de strings (caso de validation errors)
   */
  message: string | string[];

  /**
   * Flag que indica se a mensagem é segura para exibição ao usuário final
   * - true: Frontend pode exibir a mensagem diretamente ao usuário
   * - false: Frontend deve exibir mensagem genérica (ex: "Erro interno do servidor")
   */
  isUserFacing: boolean;

  /**
   * Detalhes técnicos do erro (opcional)
   * Incluído apenas em ambiente de desenvolvimento (NODE_ENV !== 'production')
   * Contém stack trace, nome da exception, detalhes de validação, etc
   */
  details?: {
    exception?: string;
    stack?: string;
    validation?: any;
    [key: string]: any;
  };
}
